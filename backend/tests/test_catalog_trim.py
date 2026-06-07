from services.qikink_service import qikink_service

ALLOWED = {
    "Classic Crew T-Shirt",
    "V Neck T-Shirt | UV34",
    "Oversized Standard T-Shirt | US22",
}

def test_catalog_only_three_tees():
    cats = {p["category"] for p in qikink_service.get_product_catalog()}
    assert cats == ALLOWED

def test_classic_crew_is_male_only():
    cat = next(p for p in qikink_service.get_product_catalog()
               if p["category"] == "Classic Crew T-Shirt")
    assert cat["genders"] == ["Male"]
