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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    created_at: datetime

class Design(BaseModel):
    model_config = ConfigDict(extra="ignore")
    design_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    image_url: str
    tags: List[str] = []
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
    created_at: datetime
    is_active: bool = True

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
    status: str  # "pending", "paid", "shipped", "delivered", "cancelled"
    shipping_address: dict
    created_at: datetime
    updated_at: datetime

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

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
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
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
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
    except:
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
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.designs.insert_one(design_doc)
    
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
    products = await db.products.find({"is_active": True}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
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
    except Exception as e:
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
    except:
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
        "status": "paid" if body.get("razorpay_payment_id") else "pending",
        "shipping_address": body["shipping_address"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    await db.orders.insert_one(order_doc)
    
    # Clear cart
    await db.cart_items.delete_many({"user_id": user.user_id})
    
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