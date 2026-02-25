"""
Backend tests for Enhanced Creator Dashboard Features
Tests: Design upload flow, product_configs, design status grouping, creator earnings
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
SESSION_TOKEN = "test_creator_session_1771988899501"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SESSION_TOKEN}"
}


class TestDesignCreationWithProducts:
    """Test design creation with product configurations"""
    
    created_design_ids = []
    
    def test_create_design_with_product_configs(self):
        """Test creating design with product_configs array"""
        response = requests.post(
            f"{BASE_URL}/api/designs",
            headers=HEADERS,
            json={
                "title": "TEST_Design_Products_1",
                "description": "Test design with products",
                "image_url": "https://via.placeholder.com/4500x5400",
                "tags": ["test", "products"],
                "products": [
                    {
                        "productType": "tshirt",
                        "color": "white",
                        "preset": "tshirt",
                        "printMethod": "dtf",
                        "basePrice": 799
                    },
                    {
                        "productType": "hoodie", 
                        "color": "black",
                        "preset": "hoodie",
                        "printMethod": "dtf",
                        "basePrice": 1499
                    },
                    {
                        "productType": "oversized_tshirt",
                        "color": "grey",
                        "preset": "oversized_tshirt",
                        "printMethod": "dtf",
                        "basePrice": 999
                    }
                ],
                "analysis": {
                    "width": 4500,
                    "height": 5400,
                    "hasTransparency": True,
                    "colorCount": 3,
                    "hasGradients": False
                }
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "design_id" in data
        assert data["title"] == "TEST_Design_Products_1"
        assert data["approval_status"] == "submitted"  # Auto-submitted when products present
        assert len(data["product_configs"]) == 3
        assert data["design_analysis"] is not None
        assert data["print_metadata"] is not None
        assert len(data["print_metadata"]["products"]) == 3
        
        # Store for cleanup
        self.__class__.created_design_ids.append(data["design_id"])
        
    def test_create_draft_design_without_products(self):
        """Test creating design without products stays as draft"""
        response = requests.post(
            f"{BASE_URL}/api/designs",
            headers=HEADERS,
            json={
                "title": "TEST_Draft_Design",
                "description": "Draft without products",
                "image_url": "https://via.placeholder.com/4500x5400",
                "tags": ["draft"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["approval_status"] == "draft"  # Should stay as draft
        assert len(data.get("product_configs", [])) == 0
        
        self.__class__.created_design_ids.append(data["design_id"])
        
    def test_create_design_with_embroidery_products(self):
        """Test creating design with embroidery products"""
        response = requests.post(
            f"{BASE_URL}/api/designs",
            headers=HEADERS,
            json={
                "title": "TEST_Embroidery_Design",
                "description": "Design with embroidery products",
                "image_url": "https://via.placeholder.com/4500x5400",
                "tags": ["embroidery"],
                "products": [
                    {
                        "productType": "varsity_jacket",
                        "color": "black",
                        "preset": "varsity_jacket",
                        "printMethod": "embroidery",
                        "basePrice": 2499
                    },
                    {
                        "productType": "cap",
                        "color": "navy",
                        "preset": "cap",
                        "printMethod": "embroidery",
                        "basePrice": 599
                    }
                ],
                "analysis": {
                    "width": 4500,
                    "height": 5400,
                    "hasTransparency": True,
                    "colorCount": 2,
                    "hasGradients": False
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify embroidery products are included
        product_types = [p["productType"] for p in data["product_configs"]]
        assert "varsity_jacket" in product_types
        assert "cap" in product_types
        
        self.__class__.created_design_ids.append(data["design_id"])


class TestDesignStatusFiltering:
    """Test design retrieval and status filtering"""
    
    def test_get_designs_returns_product_configs(self):
        """Verify designs list includes product_configs"""
        response = requests.get(
            f"{BASE_URL}/api/designs",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        designs = response.json()
        
        # Should have at least the designs we created
        assert len(designs) >= 1
        
        # Check structure
        for design in designs:
            assert "design_id" in design
            assert "approval_status" in design
            assert "product_configs" in design
            
    def test_get_single_design_with_full_data(self):
        """Test getting single design returns all enhanced fields"""
        # First get list to get a design_id
        list_response = requests.get(f"{BASE_URL}/api/designs", headers=HEADERS)
        designs = list_response.json()
        
        if not designs:
            pytest.skip("No designs to test")
            
        design_id = designs[0]["design_id"]
        
        response = requests.get(f"{BASE_URL}/api/designs/{design_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "product_configs" in data
        assert "design_analysis" in data or data.get("design_analysis") is None
        assert "approval_status" in data


class TestDesignDeletion:
    """Test design deletion"""
    
    def test_delete_draft_design(self):
        """Test deleting a draft design"""
        # Create a draft design first
        create_response = requests.post(
            f"{BASE_URL}/api/designs",
            headers=HEADERS,
            json={
                "title": "TEST_Delete_Me_Draft",
                "description": "To be deleted",
                "image_url": "https://via.placeholder.com/4500x5400",
                "tags": []
            }
        )
        
        assert create_response.status_code == 200
        design_id = create_response.json()["design_id"]
        
        # Delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/designs/{design_id}",
            headers=HEADERS
        )
        
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/designs/{design_id}")
        assert get_response.status_code == 404


class TestCreatorEarnings:
    """Test creator earnings endpoint"""
    
    def test_get_creator_earnings(self):
        """Test retrieving creator earnings"""
        response = requests.get(
            f"{BASE_URL}/api/creator/earnings",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify earnings structure
        assert "total_earnings" in data
        assert "pending_earnings" in data
        assert "total_orders" in data
        assert isinstance(data["total_earnings"], (int, float))


class TestUserProfile:
    """Test user profile endpoint"""
    
    def test_get_user_profile(self):
        """Test getting current user profile"""
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=HEADERS
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user_id" in data
        assert "email" in data
        assert "role" in data
        assert "creator_status" in data


class TestFileUpload:
    """Test design file upload endpoint"""
    
    def test_upload_requires_auth(self):
        """Test that upload requires authentication"""
        # Try without auth
        response = requests.post(f"{BASE_URL}/api/upload/design")
        assert response.status_code == 401


class TestProductConfigs:
    """Test product configuration handling"""
    
    def test_all_five_product_types(self):
        """Test that all 5 product types can be configured"""
        response = requests.post(
            f"{BASE_URL}/api/designs",
            headers=HEADERS,
            json={
                "title": "TEST_All_Products",
                "description": "All 5 product types",
                "image_url": "https://via.placeholder.com/4500x5400",
                "products": [
                    {"productType": "tshirt", "color": "white", "preset": "tshirt", "printMethod": "dtf", "basePrice": 799},
                    {"productType": "hoodie", "color": "black", "preset": "hoodie", "printMethod": "dtf", "basePrice": 1499},
                    {"productType": "oversized_tshirt", "color": "grey", "preset": "oversized_tshirt", "printMethod": "dtf", "basePrice": 999},
                    {"productType": "varsity_jacket", "color": "navy", "preset": "varsity_jacket", "printMethod": "embroidery", "basePrice": 2499},
                    {"productType": "cap", "color": "black", "preset": "cap", "printMethod": "embroidery", "basePrice": 599}
                ],
                "analysis": {
                    "width": 4500,
                    "height": 5400,
                    "hasTransparency": True,
                    "colorCount": 2,
                    "hasGradients": False
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all 5 products are stored
        assert len(data["product_configs"]) == 5
        
        product_types = [p["productType"] for p in data["product_configs"]]
        assert "tshirt" in product_types
        assert "hoodie" in product_types
        assert "oversized_tshirt" in product_types
        assert "varsity_jacket" in product_types
        assert "cap" in product_types


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed designs after all tests"""
    yield
    # Cleanup
    response = requests.get(f"{BASE_URL}/api/designs", headers=HEADERS)
    if response.status_code == 200:
        designs = response.json()
        for design in designs:
            if design.get("title", "").startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/designs/{design['design_id']}",
                    headers=HEADERS
                )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
