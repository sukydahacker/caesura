from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Cookie, Response, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import razorpay
import base64
from PIL import Image
import io
import sys

ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))
load_dotenv(ROOT_DIR / '.env')

# Import services
from services.printify_service import printify_service
from services.revenue_service import revenue_service

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', '')))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Pydantic Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "buyer"  # "buyer", "creator", "admin"
    creator_status: Optional[str] = None  # "pending", "approved", "suspended", "rejected"
    creator_bio: Optional[str] = None
    created_at: datetime

class Design(BaseModel):
    model_config = ConfigDict(extra="ignore")
    design_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    image_url: str
    tags: List[str] = []
    approval_status: str = "pending"  # "pending", "approved", "rejected"
    rejection_reason: Optional[str] = None
    approved_by_admin_id: Optional[str] = None
    featured: bool = False
    created_at: datetime
    updated_at: datetime

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str
    design_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    apparel_type: str  # "tshirt" or "hoodie"
    sizes: List[str] = ["S", "M", "L", "XL", "XXL"]
    price: float
    design_image: str
    mockup_image: str
    printify_product_id: Optional[str] = None
    printify_blueprint_id: Optional[int] = None
    base_cost: float = 500.0
    creator_commission_rate: float = 0.8
    platform_commission_rate: float = 0.2
    product_status: str = "live"  # "live", "out_of_stock", "disabled"
    units_sold: int = 0
    created_at: datetime
    is_active: bool = True
    is_approved: bool = False
    approved_at: Optional[datetime] = None

class CartItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    cart_item_id: str
    user_id: str
    product_id: str
    size: str
    quantity: int
    added_at: datetime

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    user_id: str
    items: List[dict]
    total_amount: float
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    printify_order_id: Optional[str] = None
    fulfillment_status: str = "pending"  # "pending", "printing", "shipped", "delivered", "cancelled"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    status: str  # "pending", "paid", "shipped", "delivered", "cancelled"
    shipping_address: dict
    created_at: datetime
    updated_at: datetime

class RevenueSplit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    split_id: str
    order_id: str
    creator_id: str
    creator_amount: float
    platform_amount: float
    status: str  # "pending", "completed"
    created_at: datetime

# Auth Helper
async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    # Check cookie first, then Authorization header as fallback
    token = session_token
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find session
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

async def require_admin(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    """Helper to require admin role"""
    user = await get_current_user(request, session_token)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    is_creator = body.get("is_creator", False)
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    user_doc = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if user_doc:
        user_id = user_doc["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture"),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "creator" if is_creator else "buyer"
        creator_status = "pending" if is_creator else None
        
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "role": role,
            "creator_status": creator_status,
            "created_at": datetime.now(timezone.utc)
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = auth_data["session_token"]
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set httpOnly cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Get user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return User(**user)

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# Design Routes
@api_router.post("/upload/design")
async def upload_design(request: Request, file: UploadFile = File(...), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    # Read and validate image
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Convert to base64 for storage (mock upload)
    image_data = base64.b64encode(contents).decode('utf-8')
    image_url = f"data:image/png;base64,{image_data}"
    
    return {"image_url": image_url}

@api_router.post("/designs", response_model=Design)
async def create_design(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    design_id = f"design_{uuid.uuid4().hex[:12]}"
    design_doc = {
        "design_id": design_id,
        "user_id": user.user_id,
        "title": body["title"],
        "description": body.get("description"),
        "image_url": body["image_url"],
        "tags": body.get("tags", []),
        "approval_status": "pending",
        "featured": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.designs.insert_one(design_doc)
    
    # TODO: Send email notification to admin
    logger.info(f"New design {design_id} submitted by user {user.user_id} for approval")
    
    return Design(**design_doc)

@api_router.get("/designs", response_model=List[Design])
async def get_designs(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    designs = await db.designs.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return [Design(**d) for d in designs]

@api_router.get("/designs/{design_id}", response_model=Design)
async def get_design(design_id: str):
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    return Design(**design)

@api_router.delete("/designs/{design_id}")
async def delete_design(design_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    result = await db.designs.delete_one({"design_id": design_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")
    return {"message": "Design deleted"}

# Product Routes
@api_router.post("/products", response_model=Product)
async def create_product(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    # Verify design exists and belongs to user
    design = await db.designs.find_one({"design_id": body["design_id"], "user_id": user.user_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    product_id = f"product_{uuid.uuid4().hex[:12]}"
    product_doc = {
        "product_id": product_id,
        "design_id": body["design_id"],
        "user_id": user.user_id,
        "title": body["title"],
        "description": body.get("description"),
        "apparel_type": body["apparel_type"],
        "sizes": body.get("sizes", ["S", "M", "L", "XL", "XXL"]),
        "price": body["price"],
        "design_image": design["image_url"],
        "mockup_image": body.get("mockup_image", design["image_url"]),
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    }
    await db.products.insert_one(product_doc)
    
    return Product(**product_doc)

@api_router.get("/products", response_model=List[Product])
async def get_products(skip: int = 0, limit: int = 50):
    # Only show approved AND live/out_of_stock products on marketplace (disabled products hidden)
    products = await db.products.find({
        "is_active": True, 
        "is_approved": True,
        "product_status": {"$in": ["live", "out_of_stock"]}
    }, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    return [Product(**p) for p in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

# Cart Routes
@api_router.get("/cart", response_model=List[dict])
async def get_cart(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    cart_items = await db.cart_items.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    
    # Populate with product details
    result = []
    for item in cart_items:
        product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0})
        if product:
            result.append({
                **item,
                "product": product
            })
    
    return result

@api_router.post("/cart")
async def add_to_cart(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    # Check if item already exists
    existing = await db.cart_items.find_one({
        "user_id": user.user_id,
        "product_id": body["product_id"],
        "size": body["size"]
    })
    
    if existing:
        # Update quantity
        await db.cart_items.update_one(
            {"cart_item_id": existing["cart_item_id"]},
            {"$set": {"quantity": existing["quantity"] + body.get("quantity", 1)}}
        )
        return {"message": "Cart updated"}
    else:
        # Add new item
        cart_item = {
            "cart_item_id": f"cart_{uuid.uuid4().hex[:12]}",
            "user_id": user.user_id,
            "product_id": body["product_id"],
            "size": body["size"],
            "quantity": body.get("quantity", 1),
            "added_at": datetime.now(timezone.utc)
        }
        await db.cart_items.insert_one(cart_item)
        return {"message": "Added to cart", "cart_item_id": cart_item["cart_item_id"]}

@api_router.put("/cart/{cart_item_id}")
async def update_cart_item(cart_item_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    result = await db.cart_items.update_one(
        {"cart_item_id": cart_item_id, "user_id": user.user_id},
        {"$set": {"quantity": body["quantity"]}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    result = await db.cart_items.delete_one({"cart_item_id": cart_item_id, "user_id": user.user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    return {"message": "Removed from cart"}

# Payment Routes
@api_router.post("/payments/create-order")
async def create_payment_order(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    try:
        # Create Razorpay order
        razorpay_order = razorpay_client.order.create({
            "amount": int(body["amount"] * 100),  # Convert to paise
            "currency": "INR",
            "payment_capture": 1
        })
        
        return {
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"]
        }
    except Exception:
        # If Razorpay keys not configured, return mock order
        return {
            "order_id": f"order_mock_{uuid.uuid4().hex[:12]}",
            "amount": int(body["amount"] * 100),
            "currency": "INR",
            "mock": True
        }

@api_router.post("/payments/verify")
async def verify_payment(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    # For mock orders, skip verification
    if body.get("mock"):
        return {"verified": True, "mock": True}
    
    try:
        # Verify Razorpay signature
        razorpay_client.utility.verify_payment_signature(body)
        return {"verified": True}
    except Exception:
        raise HTTPException(status_code=400, detail="Payment verification failed")

# Order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    order_id = f"order_{uuid.uuid4().hex[:12]}"
    order_doc = {
        "order_id": order_id,
        "user_id": user.user_id,
        "items": body["items"],
        "total_amount": body["total_amount"],
        "razorpay_order_id": body.get("razorpay_order_id"),
        "razorpay_payment_id": body.get("razorpay_payment_id"),
        "fulfillment_status": "pending",
        "status": "paid" if body.get("razorpay_payment_id") else "pending",
        "shipping_address": body["shipping_address"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.orders.insert_one(order_doc)
    
    # Process each item for Printify order and revenue split
    for item in body["items"]:
        product_id = item["product_id"]
        product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
        
        if product and product.get("printify_product_id"):
            # Place Printify order
            try:
                printify_order = await printify_service.create_order(
                    product_id=product["printify_product_id"],
                    variant_id=1,  # TODO: Map size to variant
                    quantity=item["quantity"],
                    shipping_address=body["shipping_address"]
                )
                
                # Update order with Printify order ID
                await db.orders.update_one(
                    {"order_id": order_id},
                    {"$set": {
                        "printify_order_id": printify_order.get("id"),
                        "tracking_number": printify_order.get("tracking_number"),
                        "tracking_url": printify_order.get("tracking_url")
                    }}
                )
            except Exception as e:
                logger.error(f"Failed to create Printify order: {e}")
        
        # Calculate and record revenue split
        if product:
            split_data = revenue_service.calculate_split(
                retail_price=item["price"],
                base_cost=product.get("base_cost", 500),
                creator_commission_rate=product.get("creator_commission_rate", 0.8),
                platform_commission_rate=product.get("platform_commission_rate", 0.2)
            )
            
            creator_earnings = split_data["creator_amount"] * item["quantity"]
            platform_earnings = split_data["platform_amount"] * item["quantity"]
            
            split_id = await revenue_service.record_split(
                db=db,
                order_id=order_id,
                creator_id=product["user_id"],
                creator_amount=creator_earnings,
                platform_amount=platform_earnings
            )
            
            logger.info(f"Revenue split created: split_id={split_id}, order={order_id}, creator_amount={creator_earnings}, platform_amount={platform_earnings}")
    
    # Clear cart
    await db.cart_items.delete_many({"user_id": user.user_id})
    
    logger.info(f"Order created: order_id={order_id}, total_amount={body['total_amount']}, status={order_doc['status']}")
    
    return Order(**order_doc)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    orders = await db.orders.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Order(**o) for o in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    order = await db.orders.find_one({"order_id": order_id, "user_id": user.user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.get("/creator/earnings")
async def get_creator_earnings(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    earnings = await revenue_service.get_creator_earnings(db, user.user_id)
    return earnings

# Admin Routes
@api_router.get("/admin/products/pending", response_model=List[Product])
async def get_pending_products(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    products = await db.products.find({"is_approved": False, "is_active": True}, {"_id": 0}).to_list(1000)
    return [Product(**p) for p in products]

@api_router.post("/admin/products/{product_id}/approve")
async def approve_product(product_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await require_admin(request, session_token)
    
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": {
            "is_approved": True,
            "approved_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product approved"}

@api_router.post("/admin/products/{product_id}/reject")
async def reject_product(product_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    
    result = await db.products.update_one(
        {"product_id": product_id},
        {"$set": {"is_active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product rejected"}

@api_router.get("/products/my-products", response_model=List[Product])
async def get_my_products(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    products = await db.products.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    return [Product(**p) for p in products]

# Enhanced Admin Routes

@api_router.get("/admin/creators/pending", response_model=List[User])
async def get_pending_creators(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    creators = await db.users.find({"role": "creator", "creator_status": "pending"}, {"_id": 0}).to_list(1000)
    return [User(**c) for c in creators]

@api_router.post("/admin/creators/{user_id}/approve")
async def approve_creator(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "creator_status": "approved",
            "approved_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # TODO: Send email notification
    logger.info(f"Creator {user_id} approved by admin {admin_user.user_id}")
    
    return {"message": "Creator approved", "user_id": user_id}

@api_router.post("/admin/creators/{user_id}/suspend")
async def suspend_creator(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "creator_status": "suspended",
            "suspended_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    # Also deactivate all their products
    await db.products.update_many(
        {"user_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    logger.info(f"Creator {user_id} suspended by admin {admin_user.user_id}")
    
    return {"message": "Creator suspended", "user_id": user_id}

@api_router.post("/admin/creators/{user_id}/reject")
async def reject_creator(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)
    
    body = await request.json()
    reason = body.get("reason", "Application rejected")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "creator_status": "rejected",
            "rejection_reason": reason,
            "rejected_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Creator not found")
    
    logger.info(f"Creator {user_id} rejected by admin {admin_user.user_id}")
    
    return {"message": "Creator rejected", "user_id": user_id}

@api_router.get("/admin/designs/pending", response_model=List[Design])
async def get_pending_designs(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    designs = await db.designs.find({"approval_status": "pending"}, {"_id": 0}).to_list(1000)
    return [Design(**d) for d in designs]

@api_router.post("/admin/designs/{design_id}/approve")
async def approve_design_admin(design_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)
    
    body = await request.json()
    blueprint_id = body.get("blueprint_id", 6)  # Default to T-shirt
    featured = body.get("featured", False)
    
    # Get design
    design = await db.designs.find_one({"design_id": design_id}, {"_id": 0})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Update design status
    await db.designs.update_one(
        {"design_id": design_id},
        {"$set": {
            "approval_status": "approved",
            "approved_by_admin_id": admin_user.user_id,
            "featured": featured,
            "approved_at": datetime.now(timezone.utc)
        }}
    )
    
    # Create Printify product (or mock)
    try:
        printify_product = await printify_service.create_product(
            design_image_url=design["image_url"],
            title=design["title"],
            description=design.get("description", ""),
            blueprint_id=blueprint_id,
            print_provider_id=1,
            variants=[1, 2, 3, 4]  # S, M, L, XL
        )
        
        printify_product_id = printify_product.get("id")
        
        # Publish product if real Printify
        if not printify_product.get("mock"):
            await printify_service.publish_product(printify_product_id)
        
    except Exception as e:
        logger.error(f"Failed to create Printify product: {e}")
        printify_product_id = None
    
    # Create product in our database
    product_id = f"product_{uuid.uuid4().hex[:12]}"
    product_doc = {
        "product_id": product_id,
        "design_id": design_id,
        "user_id": design["user_id"],
        "title": design["title"],
        "description": design.get("description"),
        "apparel_type": "tshirt" if blueprint_id == 6 else "hoodie",
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "price": 999.0,  # Default price
        "design_image": design["image_url"],
        "mockup_image": design["image_url"],
        "printify_product_id": printify_product_id,
        "printify_blueprint_id": blueprint_id,
        "base_cost": 500.0,
        "creator_commission_rate": 0.8,
        "platform_commission_rate": 0.2,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
        "is_approved": True,
        "approved_at": datetime.now(timezone.utc)
    }
    
    await db.products.insert_one(product_doc)
    
    logger.info(f"Design {design_id} approved and product {product_id} created by admin {admin_user.user_id}")
    
    return {
        "message": "Design approved and product created",
        "design_id": design_id,
        "product_id": product_id,
        "printify_product_id": printify_product_id
    }

@api_router.post("/admin/designs/{design_id}/reject")
async def reject_design_admin(design_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)
    
    body = await request.json()
    reason = body.get("reason", "Design rejected")
    
    result = await db.designs.update_one(
        {"design_id": design_id},
        {"$set": {
            "approval_status": "rejected",
            "rejection_reason": reason,
            "approved_by_admin_id": admin_user.user_id,
            "rejected_at": datetime.now(timezone.utc)
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")
    
    logger.info(f"Design {design_id} rejected by admin {admin_user.user_id}")
    
    return {"message": "Design rejected", "design_id": design_id}

@api_router.get("/admin/printify/blueprints")
async def get_printify_blueprints(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    
    blueprints = await printify_service.get_blueprints()
    return {"blueprints": blueprints, "mock_mode": printify_service.mock_mode}

@api_router.get("/admin/analytics")
async def get_admin_analytics(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    
    # Get counts
    total_users = await db.users.count_documents({})
    total_creators = await db.users.count_documents({"role": "creator"})
    pending_creators = await db.users.count_documents({"creator_status": "pending"})
    approved_creators = await db.users.count_documents({"creator_status": "approved"})
    
    total_designs = await db.designs.count_documents({})
    pending_designs = await db.designs.count_documents({"approval_status": "pending"})
    approved_designs = await db.designs.count_documents({"approval_status": "approved"})
    
    total_products = await db.products.count_documents({"is_approved": True})
    total_orders = await db.orders.count_documents({})
    
    # Calculate revenue from ORDERS (not just paid orders)
    pipeline = [
        {"$match": {"status": {"$in": ["paid", "pending"]}}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$total_amount"},
            "total_orders": {"$sum": 1}
        }}
    ]
    
    revenue_data = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_data[0]["total_revenue"] if revenue_data else 0
    
    # Platform earnings from revenue_splits (only completed/pending ones)
    platform_earnings_pipeline = [
        {"$match": {"status": {"$in": ["completed", "pending"]}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": "$platform_amount"}
        }}
    ]
    
    platform_earnings_data = await db.revenue_splits.aggregate(platform_earnings_pipeline).to_list(1)
    platform_earnings = platform_earnings_data[0]["total"] if platform_earnings_data else 0
    
    # Creator earnings from revenue_splits
    creator_earnings_pipeline = [
        {"$match": {"status": {"$in": ["completed", "pending"]}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": "$creator_amount"}
        }}
    ]
    
    creator_earnings_data = await db.revenue_splits.aggregate(creator_earnings_pipeline).to_list(1)
    creator_earnings = creator_earnings_data[0]["total"] if creator_earnings_data else 0
    
    # Calculate units sold
    units_sold_pipeline = [
        {"$match": {"status": {"$in": ["paid", "pending"]}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": None,
            "total_units": {"$sum": "$items.quantity"}
        }}
    ]
    
    units_data = await db.orders.aggregate(units_sold_pipeline).to_list(1)
    total_units = units_data[0]["total_units"] if units_data else 0
    
    logger.info(f"Analytics: Orders={total_orders}, Revenue={total_revenue}, Platform={platform_earnings}, Creator={creator_earnings}, Units={total_units}")
    
    return {
        "users": {
            "total": total_users,
            "creators": total_creators,
            "pending_creators": pending_creators,
            "approved_creators": approved_creators
        },
        "designs": {
            "total": total_designs,
            "pending": pending_designs,
            "approved": approved_designs
        },
        "products": {
            "total": total_products
        },
        "orders": {
            "total": total_orders,
            "total_units": total_units
        },
        "revenue": {
            "total_revenue": total_revenue,
            "platform_earnings": platform_earnings,
            "creator_earnings": creator_earnings
        }
    }

@api_router.get("/admin/orders")
async def get_admin_orders(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    
    # Get all orders with revenue split info
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with creator info and revenue splits
    enriched_orders = []
    for order in orders:
        # Get revenue splits for this order
        splits = await db.revenue_splits.find({"order_id": order["order_id"]}, {"_id": 0}).to_list(100)
        
        # Get creator info for each item
        items_with_creators = []
        for item in order.get("items", []):
            product = await db.products.find_one({"product_id": item["product_id"]}, {"_id": 0, "user_id": 1, "title": 1})
            if product:
                creator = await db.users.find_one({"user_id": product["user_id"]}, {"_id": 0, "name": 1, "email": 1})
                items_with_creators.append({
                    **item,
                    "creator_name": creator["name"] if creator else "Unknown",
                    "creator_email": creator["email"] if creator else "Unknown"
                })
            else:
                items_with_creators.append(item)
        
        enriched_orders.append({
            **order,
            "items": items_with_creators,
            "revenue_splits": splits
        })
    
    logger.info(f"Admin orders query returned {len(enriched_orders)} orders")
    
    return enriched_orders

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()