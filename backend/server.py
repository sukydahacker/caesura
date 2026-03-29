from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Cookie, Response, Request
from fastapi.responses import JSONResponse, RedirectResponse
from urllib.parse import urlencode
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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
import json

ROOT_DIR = Path(__file__).parent
sys.path.insert(0, str(ROOT_DIR))
load_dotenv(ROOT_DIR / '.env')

# Import services
from services.printify_service import printify_service
from services.revenue_service import revenue_service
from services.qikink_service import qikink_service
from services.email_service import send_order_confirmation, send_design_approved, send_design_rejected

# Import async PostgreSQL helpers
from db import fetch_one, fetch_all, fetch_val, execute, get_pool, close_pool, to_jsonb

BACKEND_URL    = os.environ.get("BACKEND_URL",    "http://localhost:8000")
FRONTEND_URL   = os.environ.get("FRONTEND_URL",   "http://localhost:3000")
GOOGLE_CLIENT_ID     = os.environ.get("GOOGLE_CLIENT_ID",     "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI  = f"{BACKEND_URL}/api/auth/google/callback"

# Media directory — stores uploaded design images and serves them as static files
MEDIA_DIR = ROOT_DIR / "media" / "designs"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', ''), os.environ.get('RAZORPAY_KEY_SECRET', '')))

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Serve uploaded design images at /media/designs/<filename>
app.mount("/media/designs", StaticFiles(directory=str(MEDIA_DIR)), name="media")

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

class DesignProductConfig(BaseModel):
    """Configuration for each product type a design is enabled on"""
    model_config = ConfigDict(extra="ignore")
    product_type: str  # tshirt, hoodie, oversized_tshirt, varsity_jacket, cap
    color: str  # white, black, navy, etc.
    preset: str  # preset id
    print_method: str  # dtf, embroidery
    base_price: float
    enabled: bool = True

class DesignAnalysis(BaseModel):
    """Analysis results from design validation"""
    model_config = ConfigDict(extra="ignore")
    width: int
    height: int
    has_transparency: bool = True
    color_count: int = 0
    has_gradients: bool = False

class Design(BaseModel):
    model_config = ConfigDict(extra="ignore")
    design_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    image_url: str
    price: Optional[float] = None
    tags: List[str] = []
    approval_status: str = "draft"  # "draft", "pending", "approved", "live", "rejected"
    rejection_reason: Optional[str] = None
    approved_by_admin_id: Optional[str] = None
    featured: bool = False
    # Enhanced fields
    product_configs: List[dict] = []  # Product configurations
    design_analysis: Optional[dict] = None  # Analysis metadata
    # Internal metadata (for admin/production)
    print_metadata: Optional[dict] = None  # Internal print specifications
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
    qikink_order_id: Optional[int] = None
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

# ─── Helper: parse JSONB fields that come back as strings ───────────────────
def _parse_jsonb(row: dict, *keys) -> dict:
    """Parse JSONB columns that asyncpg may return as strings."""
    for k in keys:
        v = row.get(k)
        if isinstance(v, str):
            try:
                row[k] = json.loads(v)
            except (json.JSONDecodeError, TypeError):
                pass
    return row


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
    session_doc = await fetch_one(
        "SELECT user_id, session_token, expires_at FROM user_sessions WHERE session_token = $1",
        token,
    )
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
    user_doc = await fetch_one(
        "SELECT * FROM users WHERE user_id = $1", session_doc["user_id"]
    )
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

@api_router.get("/auth/google")
async def auth_google():
    """Redirect user to Google OAuth consent screen."""
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
    }
    return RedirectResponse("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))


@api_router.get("/auth/google/callback")
async def auth_google_callback(code: str):
    """Handle Google OAuth callback: exchange code → get user info → create session → redirect to frontend."""
    async with httpx.AsyncClient() as client:
        # Exchange auth code for access token
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code":          code,
                "client_id":     GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri":  GOOGLE_REDIRECT_URI,
                "grant_type":    "authorization_code",
            },
        )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to obtain access token from Google")

        # Get user profile from Google
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        userinfo = userinfo_resp.json()

    email   = userinfo.get("email")
    name    = userinfo.get("name") or (email.split("@")[0] if email else "User")
    picture = userinfo.get("picture")

    if not email:
        raise HTTPException(status_code=400, detail="No email returned from Google")

    # Find or create user
    user_doc = await fetch_one("SELECT * FROM users WHERE email = $1", email)
    if user_doc:
        user_id = user_doc["user_id"]
        await execute(
            "UPDATE users SET name = $1, picture = $2 WHERE user_id = $3",
            name, picture, user_id,
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await execute(
            """INSERT INTO users (user_id, email, name, picture, role, creator_status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id, email, name, picture,
            "creator", "pending", datetime.now(timezone.utc),
        )

    # Create session (7-day expiry)
    session_token_val = str(uuid.uuid4())
    await execute(
        """INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
           VALUES ($1, $2, $3, $4)""",
        user_id, session_token_val,
        datetime.now(timezone.utc) + timedelta(days=7),
        datetime.now(timezone.utc),
    )

    # Set cookie and redirect to frontend dashboard
    redirect = RedirectResponse(url=f"{FRONTEND_URL}/dashboard")
    redirect.set_cookie(
        key="session_token",
        value=session_token_val,
        httponly=False,
        samesite="lax",
        secure=False,
        path="/",
        max_age=7 * 24 * 60 * 60,
    )
    return redirect

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await execute("DELETE FROM user_sessions WHERE session_token = $1", session_token)
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# Design Routes
@api_router.post("/upload/design")
async def upload_design(request: Request, file: UploadFile = File(...), session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)

    contents = await file.read()

    # Validate image
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Determine file extension
    ext = (file.filename or "design.png").rsplit(".", 1)[-1].lower()
    if ext not in {"png", "jpg", "jpeg", "webp", "gif"}:
        ext = "png"

    # Save to disk with a unique filename
    filename = f"{uuid.uuid4().hex}.{ext}"
    dest = MEDIA_DIR / filename
    dest.write_bytes(contents)

    # Return a publicly accessible URL (Qikink will fetch this during order creation)
    image_url = f"{BACKEND_URL}/media/designs/{filename}"
    return {"image_url": image_url, "url": image_url}

@api_router.post("/designs", response_model=Design)
async def create_design(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()

    design_id = f"design_{uuid.uuid4().hex[:12]}"

    # Extract product configurations if provided
    product_configs = body.get("products", [])
    design_analysis = body.get("analysis", None)

    initial_status = "pending_approval" if (product_configs or body.get("price")) else "draft"

    # Build internal print metadata
    print_metadata = None
    if product_configs:
        print_metadata = {
            "products": [
                {
                    "product_type": pc.get("productType"),
                    "print_method": pc.get("printMethod"),
                    "preset_id": pc.get("preset"),
                    "placement": "front",
                    "final_print_size": calculate_print_size(pc.get("productType"), design_analysis)
                }
                for pc in product_configs
            ],
            "submitted_at": datetime.now(timezone.utc).isoformat()
        }

    now = datetime.now(timezone.utc)
    tags = body.get("tags", [])

    # New Qikink-style fields
    size_prices = body.get("size_prices")          # JSONB: {"S": 599, "M": 599, ...}
    selected_colors = body.get("selected_colors", [])  # TEXT[]
    print_type = body.get("print_type", "dtf")     # TEXT
    description_html = body.get("description_html") # TEXT (rich HTML)

    await execute(
        """INSERT INTO designs
               (design_id, user_id, title, description, image_url, mockup_image_url,
                product_type, placement_coordinates, price, tags, approval_status,
                featured, product_configs, design_analysis, print_metadata,
                size_prices, selected_colors, print_type, description_html,
                created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)""",
        design_id, user.user_id, body["title"], body.get("description"),
        body["image_url"], body.get("mockup_image_url"),
        body.get("product_type", "UT27"),
        to_jsonb(body.get("placement_coordinates")),
        body.get("price"), tags, initial_status,
        False, to_jsonb(product_configs), to_jsonb(design_analysis),
        to_jsonb(print_metadata),
        to_jsonb(size_prices), selected_colors, print_type, description_html,
        now, now,
    )

    design_doc = {
        "design_id": design_id,
        "user_id": user.user_id,
        "title": body["title"],
        "description": body.get("description"),
        "image_url": body["image_url"],
        "mockup_image_url": body.get("mockup_image_url"),
        "product_type": body.get("product_type", "UT27"),
        "placement_coordinates": body.get("placement_coordinates"),
        "price": body.get("price"),
        "tags": tags,
        "approval_status": initial_status,
        "featured": False,
        "product_configs": product_configs,
        "design_analysis": design_analysis,
        "print_metadata": print_metadata,
        "created_at": now,
        "updated_at": now,
    }

    logger.info(f"New design {design_id} submitted by user {user.user_id} with {len(product_configs)} products")

    return Design(**design_doc)


def calculate_print_size(product_type: str, analysis: dict) -> dict:
    """Calculate final print dimensions based on preset and design analysis"""
    presets = {
        "tshirt": {"max_width_cm": 38, "max_height_cm": 48, "scale_ratio": 0.85},
        "hoodie": {"max_width_cm": 38, "max_height_cm": 48, "scale_ratio": 0.85},
        "oversized_tshirt": {"max_width_cm": 40, "max_height_cm": 52, "scale_ratio": 0.82},
        "varsity_jacket": {"max_width_cm": 9, "max_height_cm": 9, "scale_ratio": 0.9},
        "cap": {"max_width_cm": 6.5, "max_height_cm": 5, "scale_ratio": 0.9}
    }

    preset = presets.get(product_type, presets["tshirt"])

    if not analysis:
        return {
            "width_cm": preset["max_width_cm"] * preset["scale_ratio"],
            "height_cm": preset["max_height_cm"] * preset["scale_ratio"]
        }

    design_width = analysis.get("width", 4500)
    design_height = analysis.get("height", 5400)
    aspect_ratio = design_width / design_height

    max_w = preset["max_width_cm"] * preset["scale_ratio"]
    max_h = preset["max_height_cm"] * preset["scale_ratio"]

    if aspect_ratio > (max_w / max_h):
        final_w = max_w
        final_h = max_w / aspect_ratio
    else:
        final_h = max_h
        final_w = max_h * aspect_ratio

    return {
        "width_cm": round(final_w, 2),
        "height_cm": round(final_h, 2)
    }

@api_router.get("/designs/library")
async def get_design_library(request: Request, session_token: Optional[str] = Cookie(None)):
    """Return current user's uploaded design images for the design library panel."""
    user = await get_current_user(request, session_token)
    rows = await fetch_all(
        """SELECT DISTINCT ON (image_url) image_url, title, created_at
           FROM designs WHERE user_id = $1 AND image_url IS NOT NULL
           ORDER BY image_url, created_at DESC""",
        user.user_id,
    )
    return [{"image_url": r["image_url"], "title": r["title"], "created_at": r["created_at"]} for r in rows]


@api_router.get("/designs", response_model=List[Design])
async def get_designs(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    rows = await fetch_all("SELECT * FROM designs WHERE user_id = $1", user.user_id)
    for r in rows:
        _parse_jsonb(r, 'placement_coordinates', 'product_configs', 'design_analysis', 'print_metadata')
    return [Design(**d) for d in rows]

@api_router.get("/designs/{design_id}", response_model=Design)
async def get_design(design_id: str):
    design = await fetch_one("SELECT * FROM designs WHERE design_id = $1", design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    _parse_jsonb(design, 'placement_coordinates', 'product_configs', 'design_analysis', 'print_metadata')
    return Design(**design)

@api_router.delete("/designs/{design_id}")
async def delete_design(design_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    result = await execute(
        "DELETE FROM designs WHERE design_id = $1 AND user_id = $2",
        design_id, user.user_id,
    )
    # asyncpg execute returns status string like "DELETE 1"
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Design not found")
    return {"message": "Design deleted"}

# Product Routes
@api_router.post("/products", response_model=Product)
async def create_product(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()

    # Verify design exists and belongs to user
    design = await fetch_one(
        "SELECT * FROM designs WHERE design_id = $1 AND user_id = $2",
        body["design_id"], user.user_id,
    )
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    product_id = f"product_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    sizes = body.get("sizes", ["S", "M", "L", "XL", "XXL"])

    await execute(
        """INSERT INTO products
               (product_id, design_id, user_id, title, description, apparel_type,
                sizes, price, design_image, mockup_image, overlay_image, created_at, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)""",
        product_id, body["design_id"], user.user_id,
        body["title"], body.get("description"), body["apparel_type"],
        sizes, body["price"],
        design["image_url"], body.get("mockup_image", design["image_url"]),
        design["image_url"], now, True,
    )

    product_doc = {
        "product_id": product_id,
        "design_id": body["design_id"],
        "user_id": user.user_id,
        "title": body["title"],
        "description": body.get("description"),
        "apparel_type": body["apparel_type"],
        "sizes": sizes,
        "price": body["price"],
        "design_image": design["image_url"],
        "mockup_image": body.get("mockup_image", design["image_url"]),
        "created_at": now,
        "is_active": True,
    }

    return Product(**product_doc)

@api_router.get("/products", response_model=List[Product])
async def get_products(skip: int = 0, limit: int = 50):
    rows = await fetch_all(
        """SELECT * FROM products
           WHERE is_active = true AND is_approved = true
                 AND product_status IN ('live', 'out_of_stock')
           OFFSET $1 LIMIT $2""",
        skip, limit,
    )
    return [Product(**p) for p in rows]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await fetch_one("SELECT * FROM products WHERE product_id = $1", product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    _parse_jsonb(product, 'placement_coordinates')
    return Product(**product)

# Cart Routes
@api_router.get("/cart", response_model=List[dict])
async def get_cart(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    cart_items = await fetch_all(
        "SELECT * FROM cart_items WHERE user_id = $1", user.user_id
    )

    # Populate with product details
    result = []
    for item in cart_items:
        product = await fetch_one(
            "SELECT * FROM products WHERE product_id = $1", item["product_id"]
        )
        if product:
            _parse_jsonb(product, 'placement_coordinates')
            result.append({**item, "product": product})

    return result

@api_router.post("/cart")
async def add_to_cart(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()

    # Check if item already exists
    existing = await fetch_one(
        """SELECT * FROM cart_items
           WHERE user_id = $1 AND product_id = $2 AND size = $3""",
        user.user_id, body["product_id"], body["size"],
    )

    if existing:
        await execute(
            "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2",
            existing["quantity"] + body.get("quantity", 1),
            existing["cart_item_id"],
        )
        return {"message": "Cart updated"}
    else:
        cart_item_id = f"cart_{uuid.uuid4().hex[:12]}"
        await execute(
            """INSERT INTO cart_items (cart_item_id, user_id, product_id, size, quantity, added_at)
               VALUES ($1,$2,$3,$4,$5,$6)""",
            cart_item_id, user.user_id, body["product_id"],
            body["size"], body.get("quantity", 1), datetime.now(timezone.utc),
        )
        return {"message": "Added to cart", "cart_item_id": cart_item_id}

@api_router.put("/cart/{cart_item_id}")
async def update_cart_item(cart_item_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    body = await request.json()

    result = await execute(
        "UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3",
        body["quantity"], cart_item_id, user.user_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Cart item not found")

    return {"message": "Cart updated"}

@api_router.delete("/cart/{cart_item_id}")
async def remove_from_cart(cart_item_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    result = await execute(
        "DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2",
        cart_item_id, user.user_id,
    )

    if result == "DELETE 0":
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
    now = datetime.now(timezone.utc)
    status = "paid" if body.get("razorpay_payment_id") else "pending"

    await execute(
        """INSERT INTO orders
               (order_id, user_id, items, total_amount, razorpay_order_id,
                razorpay_payment_id, fulfillment_status, status, shipping_address,
                created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10)""",
        order_id, user.user_id, to_jsonb(body["items"]), body["total_amount"],
        body.get("razorpay_order_id"), body.get("razorpay_payment_id"),
        status, to_jsonb(body["shipping_address"]), now, now,
    )

    order_doc = {
        "order_id": order_id,
        "user_id": user.user_id,
        "items": body["items"],
        "total_amount": body["total_amount"],
        "razorpay_order_id": body.get("razorpay_order_id"),
        "razorpay_payment_id": body.get("razorpay_payment_id"),
        "fulfillment_status": "pending",
        "status": status,
        "shipping_address": body["shipping_address"],
        "created_at": now,
        "updated_at": now,
    }

    # ── Per-item: revenue splits + build Qikink line items ────────────────────
    qikink_items = []

    for item in body["items"]:
        product_id = item["product_id"]
        product = await fetch_one("SELECT * FROM products WHERE product_id = $1", product_id)

        if not product:
            continue

        # Revenue split
        split_data = revenue_service.calculate_split(
            retail_price=item["price"],
            base_cost=float(product.get("base_cost") or 500),
            creator_commission_rate=float(product.get("creator_commission_rate") or 0.8),
            platform_commission_rate=float(product.get("platform_commission_rate") or 0.2),
        )
        creator_earnings  = split_data["creator_amount"] * item["quantity"]
        platform_earnings = split_data["platform_amount"] * item["quantity"]
        split_id = await revenue_service.record_split(
            order_id=order_id,
            creator_id=product["user_id"],
            creator_amount=creator_earnings,
            platform_amount=platform_earnings,
        )
        logger.info(f"Revenue split {split_id}: order={order_id}, creator=₹{creator_earnings}, platform=₹{platform_earnings}")

        # Gather design data for Qikink
        design = await fetch_one("SELECT * FROM designs WHERE design_id = $1", product.get("design_id"))
        if design:
            _parse_jsonb(design, 'placement_coordinates', 'product_configs', 'design_analysis', 'print_metadata')
            qikink_items.append({
                "product":  product,
                "design":   design,
                "size":     item.get("size", "M"),
                "color":    item.get("color", "white"),
                "quantity": item["quantity"],
                "price":    item["price"],
            })

    # ── Forward to Qikink ────────────────────────────────────────────────────────
    if qikink_items and qikink_service.is_configured:
        try:
            qikink_result = await qikink_service.create_order(
                order_number=order_id,
                items=qikink_items,
                shipping_address=body["shipping_address"],
                total_order_value=body["total_amount"],
            )
            qikink_order_id = qikink_result.get("order_id")
            await execute(
                """UPDATE orders SET qikink_order_id = $1, fulfillment_status = 'printing',
                       updated_at = $2 WHERE order_id = $3""",
                qikink_order_id, datetime.now(timezone.utc), order_id,
            )
            order_doc["qikink_order_id"]    = qikink_order_id
            order_doc["fulfillment_status"] = "printing"
            logger.info(f"Qikink order created: qikink_order_id={qikink_order_id} for caesura order={order_id}")
        except Exception as e:
            logger.error(f"Qikink order creation failed for {order_id}: {e}")
    elif qikink_items and not qikink_service.is_configured:
        logger.warning("Qikink not configured — skipping print fulfillment. Set QIKINK_CLIENT_ID and QIKINK_CLIENT_SECRET in .env")

    # Clear cart
    await execute("DELETE FROM cart_items WHERE user_id = $1", user.user_id)

    logger.info(f"Order created: order_id={order_id}, total_amount={body['total_amount']}, status={order_doc['status']}")

    # Send order confirmation email (fire-and-forget)
    addr = body.get("shipping_address", {})
    buyer_email = addr.get("email") or user.email
    if buyer_email:
        await send_order_confirmation(
            buyer_email=buyer_email,
            buyer_name=addr.get("name") or user.name,
            order_id=order_id,
            items=body.get("items", []),
            total_amount=body["total_amount"],
            shipping_address=addr,
        )

    return Order(**order_doc)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    rows = await fetch_all(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", user.user_id
    )
    for r in rows:
        _parse_jsonb(r, 'items', 'shipping_address')
    return [Order(**o) for o in rows]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    order = await fetch_one(
        "SELECT * FROM orders WHERE order_id = $1 AND user_id = $2", order_id, user.user_id
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    _parse_jsonb(order, 'items', 'shipping_address')
    return Order(**order)

@api_router.post("/orders/{order_id}/sync-fulfillment")
async def sync_order_fulfillment(order_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    """Poll Qikink for the latest fulfillment status and update our DB."""
    user = await get_current_user(request, session_token)
    order = await fetch_one(
        "SELECT * FROM orders WHERE order_id = $1 AND user_id = $2", order_id, user.user_id
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    qikink_order_id = order.get("qikink_order_id")
    if not qikink_order_id:
        return {"message": "No Qikink order linked to this order", "fulfillment_status": order.get("fulfillment_status")}

    try:
        qk = await qikink_service.get_order_status(qikink_order_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Qikink API error: {e}")

    status_map = {
        "Pending":    "pending",
        "Processing": "printing",
        "Shipped":    "shipped",
        "Delivered":  "delivered",
        "Cancelled":  "cancelled",
        "Archived":   "delivered",
    }
    qk_status = qk.get("status", "")
    fulfillment_status = status_map.get(qk_status, order.get("fulfillment_status", "pending"))

    shipping = qk.get("shipping", {})
    tracking_number = shipping.get("awb")
    tracking_url    = shipping.get("tracking_link")

    await execute(
        """UPDATE orders SET fulfillment_status = $1, tracking_number = $2,
               tracking_url = $3, updated_at = $4 WHERE order_id = $5""",
        fulfillment_status, tracking_number, tracking_url,
        datetime.now(timezone.utc), order_id,
    )

    return {
        "fulfillment_status": fulfillment_status,
        "qikink_status":      qk_status,
        "tracking_number":    tracking_number,
        "tracking_url":       tracking_url,
    }

@api_router.get("/admin/qikink/status")
async def qikink_status(request: Request, session_token: Optional[str] = Cookie(None)):
    """Admin endpoint: verify Qikink credentials are working."""
    await require_admin(request, session_token)
    ok = await qikink_service.ping()
    return {
        "configured": qikink_service.is_configured,
        "reachable":  ok,
        "sandbox":    os.environ.get("QIKINK_SANDBOX", "true").lower() != "false",
        "base_url":   qikink_service.base_url,
    }

@api_router.get("/creator/earnings")
async def get_creator_earnings(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    earnings = await revenue_service.get_creator_earnings(user.user_id)
    return earnings

# Admin Routes
@api_router.get("/admin/products/pending", response_model=List[Product])
async def get_pending_products(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    products = await fetch_all(
        "SELECT * FROM products WHERE is_approved = false AND is_active = true"
    )
    return [Product(**p) for p in products]

@api_router.post("/admin/products/{product_id}/approve")
async def approve_product(product_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await require_admin(request, session_token)

    result = await execute(
        "UPDATE products SET is_approved = true, approved_at = $1 WHERE product_id = $2",
        datetime.now(timezone.utc), product_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product approved"}

@api_router.post("/admin/products/{product_id}/reject")
async def reject_product(product_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)

    result = await execute(
        "UPDATE products SET is_active = false WHERE product_id = $1", product_id
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product rejected"}

@api_router.get("/products/my-products", response_model=List[Product])
async def get_my_products(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    products = await fetch_all(
        "SELECT * FROM products WHERE user_id = $1", user.user_id
    )
    return [Product(**p) for p in products]

# Enhanced Admin Routes

@api_router.get("/admin/creators/pending", response_model=List[User])
async def get_pending_creators(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    creators = await fetch_all(
        "SELECT * FROM users WHERE role = 'creator' AND creator_status = 'pending'"
    )
    return [User(**c) for c in creators]

@api_router.post("/admin/creators/{user_id}/approve")
async def approve_creator(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)

    result = await execute(
        "UPDATE users SET creator_status = 'approved', approved_at = $1 WHERE user_id = $2",
        datetime.now(timezone.utc), user_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Creator not found")

    logger.info(f"Creator {user_id} approved by admin {admin_user.user_id}")

    return {"message": "Creator approved", "user_id": user_id}

@api_router.post("/admin/creators/{user_id}/suspend")
async def suspend_creator(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)

    result = await execute(
        "UPDATE users SET creator_status = 'suspended', suspended_at = $1 WHERE user_id = $2",
        datetime.now(timezone.utc), user_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Creator not found")

    # Also deactivate all their products
    await execute(
        "UPDATE products SET is_active = false WHERE user_id = $1", user_id
    )

    logger.info(f"Creator {user_id} suspended by admin {admin_user.user_id}")

    return {"message": "Creator suspended", "user_id": user_id}

@api_router.post("/admin/creators/{user_id}/reject")
async def reject_creator(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)

    body = await request.json()
    reason = body.get("reason", "Application rejected")

    result = await execute(
        """UPDATE users SET creator_status = 'rejected', rejection_reason = $1,
               rejected_at = $2 WHERE user_id = $3""",
        reason, datetime.now(timezone.utc), user_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Creator not found")

    logger.info(f"Creator {user_id} rejected by admin {admin_user.user_id}")

    return {"message": "Creator rejected", "user_id": user_id}

@api_router.get("/admin/designs/pending")
async def get_pending_designs(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    designs = await fetch_all(
        "SELECT * FROM designs WHERE approval_status IN ('pending', 'pending_approval')"
    )
    # Enrich each design with creator name
    result = []
    for d in designs:
        _parse_jsonb(d, 'placement_coordinates', 'product_configs', 'design_analysis', 'print_metadata')
        creator = await fetch_one(
            "SELECT name, email FROM users WHERE user_id = $1", d["user_id"]
        )
        d["creator_name"] = creator.get("name", "Unknown") if creator else "Unknown"
        d["creator_email"] = creator.get("email", "") if creator else ""
        result.append(d)
    return result

def get_mockup_url(blueprint_id: int, product_configs: list) -> str:
    """Pick a real garment mockup image based on product type and color"""
    color = "white"
    if product_configs:
        first = product_configs[0] if isinstance(product_configs[0], dict) else {}
        color = first.get("color", "white").lower()

    mockups = {
        "tshirt": {
            "white": "/mockups/tshirt-whitefront.jpg",
            "black": "/mockups/tshirt-blackfront.jpg",
            "yellow": "/mockups/tshirt-yellow.jpg",
            "grey": "/mockups/Grey-Front.jpg",
        },
        "hoodie": {
            "white": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
            "black": "/mockups/hoodie-grey.jpg",
            "grey": "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800",
        }
    }

    product_type = "hoodie" if blueprint_id != 6 else "tshirt"
    color_map = mockups.get(product_type, mockups["tshirt"])
    return color_map.get(color, color_map.get("white", "/mockups/tshirt-whitefront.jpg"))

@api_router.post("/admin/designs/{design_id}/approve")
async def approve_design_admin(design_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)

    body = await request.json()
    apparel_type = body.get("apparel_type", "tshirt")
    featured     = body.get("featured", False)

    design = await fetch_one("SELECT * FROM designs WHERE design_id = $1", design_id)
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    _parse_jsonb(design, 'placement_coordinates', 'product_configs', 'design_analysis', 'print_metadata')

    product_type = design.get("product_type") or apparel_type or "UT27"

    FALLBACK_MOCKUPS = {
        "UT27": "/mockups/tshirt-offwhitefront.png",
        "UH24": "/mockups/tshirt-whitefront.jpg",
        "tshirt": "/mockups/tshirt-whitefront.jpg",
        "hoodie": "/mockups/tshirt-whitefront.jpg",
        "oversized_tshirt": "/mockups/tshirt-offwhitefront.png",
    }
    mockup_image = design.get("mockup_image_url") or FALLBACK_MOCKUPS.get(product_type, "/mockups/tshirt-whitefront.jpg")

    # Update design status to approved
    now = datetime.now(timezone.utc)
    await execute(
        """UPDATE designs SET approval_status = 'approved', approved_by_admin_id = $1,
               featured = $2, approved_at = $3 WHERE design_id = $4""",
        admin_user.user_id, featured, now, design_id,
    )

    # Build product
    price = design.get("price") or 999.0
    product_id = f"product_{uuid.uuid4().hex[:12]}"

    await execute(
        """INSERT INTO products
               (product_id, design_id, user_id, title, description, apparel_type,
                sizes, price, design_image, mockup_image,
                placement_coordinates, qikink_design_code,
                base_cost, creator_commission_rate, platform_commission_rate,
                product_status, units_sold, created_at, is_active, is_approved, approved_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)""",
        product_id, design_id, design["user_id"], design["title"],
        design.get("description"), product_type,
        ["S", "M", "L", "XL", "XXL"], float(price),
        design["image_url"], mockup_image,
        to_jsonb(design.get("placement_coordinates")), design_id,
        500.0, 0.8, 0.2,
        "live", 0, now, True, True, now,
    )

    logger.info(f"Design {design_id} approved → product {product_id} (apparel={apparel_type}, price=₹{price}) by admin {admin_user.user_id}")

    # Notify creator
    creator = await fetch_one("SELECT email, name FROM users WHERE user_id = $1", design["user_id"])
    if creator:
        await send_design_approved(
            creator_email=creator["email"],
            creator_name=creator["name"],
            design_title=design["title"],
            product_id=product_id,
            frontend_url=FRONTEND_URL,
        )

    return {
        "message":    "Design approved and product created",
        "design_id":  design_id,
        "product_id": product_id,
    }

@api_router.post("/admin/designs/{design_id}/reject")
async def reject_design_admin(design_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)

    body = await request.json()
    reason = body.get("reason", "Design rejected")

    result = await execute(
        """UPDATE designs SET approval_status = 'rejected', rejection_reason = $1,
               approved_by_admin_id = $2, rejected_at = $3 WHERE design_id = $4""",
        reason, admin_user.user_id, datetime.now(timezone.utc), design_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Design not found")

    logger.info(f"Design {design_id} rejected by admin {admin_user.user_id}")

    # Notify creator
    design = await fetch_one("SELECT title, user_id FROM designs WHERE design_id = $1", design_id)
    if design:
        creator = await fetch_one("SELECT email, name FROM users WHERE user_id = $1", design["user_id"])
        if creator:
            await send_design_rejected(
                creator_email=creator["email"],
                creator_name=creator["name"],
                design_title=design["title"],
                reason=reason,
                frontend_url=FRONTEND_URL,
            )

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
    total_users = await fetch_val("SELECT COUNT(*) FROM users")
    total_creators = await fetch_val("SELECT COUNT(*) FROM users WHERE role = 'creator'")
    pending_creators = await fetch_val("SELECT COUNT(*) FROM users WHERE creator_status = 'pending'")
    approved_creators = await fetch_val("SELECT COUNT(*) FROM users WHERE creator_status = 'approved'")

    total_designs = await fetch_val("SELECT COUNT(*) FROM designs")
    pending_designs = await fetch_val(
        "SELECT COUNT(*) FROM designs WHERE approval_status IN ('pending', 'pending_approval')"
    )
    approved_designs = await fetch_val(
        "SELECT COUNT(*) FROM designs WHERE approval_status = 'approved'"
    )

    total_products = await fetch_val("SELECT COUNT(*) FROM products WHERE is_approved = true")
    live_products = await fetch_val(
        "SELECT COUNT(*) FROM products WHERE is_approved = true AND product_status = 'live'"
    )
    total_orders = await fetch_val("SELECT COUNT(*) FROM orders")

    # Total revenue from orders
    total_revenue = await fetch_val(
        "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('paid', 'pending')"
    ) or 0

    # Platform earnings from revenue_splits
    platform_earnings = await fetch_val(
        "SELECT COALESCE(SUM(platform_amount), 0) FROM revenue_splits WHERE status IN ('completed', 'pending')"
    ) or 0

    # Creator earnings from revenue_splits
    creator_earnings = await fetch_val(
        "SELECT COALESCE(SUM(creator_amount), 0) FROM revenue_splits WHERE status IN ('completed', 'pending')"
    ) or 0

    # Units sold — items is JSONB array, we need to sum quantities
    # Using a lateral join to unwind the JSONB array
    total_units = await fetch_val(
        """SELECT COALESCE(SUM((item->>'quantity')::int), 0)
           FROM orders, jsonb_array_elements(items) AS item
           WHERE status IN ('paid', 'pending')"""
    ) or 0

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
            "total": total_products,
            "live": live_products
        },
        "orders": {
            "total": total_orders,
            "total_units": total_units
        },
        "revenue": {
            "total_revenue": float(total_revenue),
            "platform_earnings": float(platform_earnings),
            "creator_earnings": float(creator_earnings)
        }
    }

@api_router.get("/admin/users")
async def get_admin_users(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)
    users = await fetch_all(
        """SELECT user_id, name, email, role, creator_status, picture, created_at
           FROM users ORDER BY created_at DESC"""
    )
    return users

@api_router.get("/admin/orders")
async def get_admin_orders(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)

    # Get all orders
    orders = await fetch_all("SELECT * FROM orders ORDER BY created_at DESC")

    # Enrich with creator info and revenue splits
    enriched_orders = []
    for order in orders:
        _parse_jsonb(order, 'items', 'shipping_address')

        # Get revenue splits for this order
        splits = await fetch_all(
            "SELECT * FROM revenue_splits WHERE order_id = $1", order["order_id"]
        )

        # Get creator info for each item
        items_with_creators = []
        for item in order.get("items", []):
            product = await fetch_one(
                "SELECT user_id, title FROM products WHERE product_id = $1",
                item["product_id"],
            )
            if product:
                creator = await fetch_one(
                    "SELECT name, email FROM users WHERE user_id = $1",
                    product["user_id"],
                )
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

@api_router.get("/admin/products/live")
async def get_live_products(request: Request, session_token: Optional[str] = Cookie(None)):
    await require_admin(request, session_token)

    products = await fetch_all(
        """SELECT * FROM products
           WHERE is_approved = true AND is_active = true
           ORDER BY created_at DESC"""
    )

    enriched_products = []
    for product in products:
        _parse_jsonb(product, 'placement_coordinates')
        # Get creator info
        creator = await fetch_one(
            "SELECT name, email FROM users WHERE user_id = $1", product["user_id"]
        )

        # Calculate units sold from orders
        units_sold = await fetch_val(
            """SELECT COALESCE(SUM((item->>'quantity')::int), 0)
               FROM orders, jsonb_array_elements(items) AS item
               WHERE status IN ('paid', 'pending')
                     AND item->>'product_id' = $1""",
            product["product_id"],
        ) or 0

        enriched_products.append({
            **product,
            "creator_name": creator["name"] if creator else "Unknown",
            "creator_email": creator["email"] if creator else "Unknown",
            "units_sold": units_sold
        })

    logger.info(f"Admin live products query returned {len(enriched_products)} products")

    return enriched_products

@api_router.put("/admin/products/{product_id}/status")
async def update_product_status(product_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    admin_user = await require_admin(request, session_token)
    body = await request.json()
    new_status = body.get("status")  # "live", "out_of_stock", "disabled"

    if new_status not in ["live", "out_of_stock", "disabled"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be: live, out_of_stock, or disabled")

    # Get product
    product = await fetch_one("SELECT * FROM products WHERE product_id = $1", product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Safety check: if disabling, check if product has orders
    if new_status == "disabled":
        has_orders = await fetch_one(
            """SELECT 1 FROM orders, jsonb_array_elements(items) AS item
               WHERE item->>'product_id' = $1
                     AND status IN ('paid', 'pending')
               LIMIT 1""",
            product_id,
        )
        if has_orders:
            logger.warning(f"Admin tried to disable product {product_id} which has existing orders")

    # Update product status
    result = await execute(
        """UPDATE products SET product_status = $1, status_updated_at = $2,
               status_updated_by = $3 WHERE product_id = $4""",
        new_status, datetime.now(timezone.utc), admin_user.user_id, product_id,
    )

    if result == "UPDATE 0":
        raise HTTPException(status_code=404, detail="Product not found")

    logger.info(f"Product {product_id} status changed to '{new_status}' by admin {admin_user.user_id}")

    return {
        "message": f"Product status updated to {new_status}",
        "product_id": product_id,
        "new_status": new_status
    }

@api_router.get("/catalog/products")
async def get_product_catalog():
    """Return the full Qikink product catalog (categories, colors, sizes, base prices)."""
    return qikink_service.get_product_catalog()

# Include router
app.include_router(api_router)

# CORS — credentials require explicit origins (wildcard + credentials is rejected by browsers)
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', _default_origins).split(','),
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
    await close_pool()

@app.post("/api/auth/dev-login")
async def dev_login(request: Request, response: Response):
    body = await request.json()
    email = body.get("email")
    secret = body.get("secret")

    if secret != "caesura-dev-2026":
        raise HTTPException(status_code=403, detail="Invalid secret")

    user_doc = await fetch_one("SELECT * FROM users WHERE email = $1", email)
    if not user_doc:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await execute(
            """INSERT INTO users (user_id, email, name, picture, role, creator_status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)""",
            user_id, email, email.split("@")[0], None,
            "admin", "approved", datetime.now(timezone.utc),
        )
        user_doc = await fetch_one("SELECT * FROM users WHERE user_id = $1", user_id)

    session_token_val = str(uuid.uuid4())
    await execute(
        """INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
           VALUES ($1, $2, $3, $4)""",
        user_doc["user_id"], session_token_val,
        datetime.now(timezone.utc) + timedelta(days=7),
        datetime.now(timezone.utc),
    )

    response.set_cookie(key="session_token", value=session_token_val, httponly=False, samesite="lax", secure=False)
    return {"user": user_doc}
