# Product Schema - Complete Field Reference

This document provides a complete reference for all fields in the Product schema when adding a new product.

## Basic Product Fields (Always Required)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | String | ✅ Yes | - | Product name |
| `category` | String | ✅ Yes | - | Product category (see categories below) |
| `price` | Number | ✅ Yes | - | Base price of the product |
| `description` | String | ✅ Yes | - | Short product description |
| `images` | Array[String] | ✅ Yes | - | Main product images (array of image URLs/paths) |
| `stock` | Number | ✅ Yes | 0 | Main product stock quantity (used when hasVariations = false) |
| `details` | Object | ✅ Yes | - | Category-specific details (see category-specific fields below) |

## Basic Product Fields (Optional)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `productId` | String | ❌ No | Auto-generated | Unique product ID (auto-generated if not provided) |
| `slug` | String | ❌ No | Auto-generated | URL-friendly slug (auto-generated from name) |
| `discountPrice` | Number | ❌ No | - | Discounted/sale price |
| `longDescription` | String | ❌ No | - | Detailed product description |
| `warrantyPeriod` | String | ❌ No | "No Warranty" | Warranty period (e.g., "1 Year", "6 Months") |
| `kokoPay` | Boolean | ❌ No | false | Enable KOKO payment method for this product |
| `isNewArrival` | Boolean | ❌ No | false | Mark product as new arrival |
| `newArrivalOrder` | Number | ❌ No | 0 | Display order for new arrivals section |
| `displayOrder` | Number | ❌ No | 0 | General display order for product listings |

## Variations System

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `hasVariations` | Boolean | ❌ No | false | Enable product variations (e.g., different storage/color combinations) |
| `variations` | Array[Object] | ⚠️ Conditional | [] | Array of variation objects (required if hasVariations = true) |

### Variation Object Structure

Each variation in the `variations` array has the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attributes` | Map/Object | ✅ Yes | Variation attributes (e.g., `{ storage: "128GB", color: "Black" }`) |
| `stock` | Number | ✅ Yes | Stock quantity for this specific variation |
| `price` | Number | ❌ No | Optional price override for this variation |
| `discountPrice` | Number | ❌ No | Optional discount price override for this variation |
| `images` | Array[String] | ❌ No | Optional images specific to this variation |
| `sku` | String | ❌ No | Optional SKU (Stock Keeping Unit) for this variation |

**Example Variation:**
```json
{
  "attributes": {
    "storage": "128GB",
    "color": "Black"
  },
  "stock": 10,
  "price": 145000,
  "discountPrice": 140000,
  "images": ["/uploads/variation-black-128gb.jpg"],
  "sku": "IPHONE-13-128GB-BLACK"
}
```

## Legacy Color Variants (Optional)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `variants` | Array[Object] | ❌ No | Legacy color variants (for backward compatibility) |

### Variant Object Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `color` | String | ✅ Yes | Color name |
| `images` | Array[String] | ✅ Yes | Images for this color variant |
| `stock` | Number | ❌ No | Stock quantity for this color (default: 0) |

## Categories

The `category` field accepts one of the following values:

### Main Categories
- `Electronics`
- `Mobile Accessories`
- `Pre-owned Devices`
- `Other`

### Subcategories
- `Mobile Phone`
- `Preowned Phones`
- `Laptops`
- `Preowned Laptops`
- `Tablets`
- `Preowned Tablets`
- `Phone Covers`
- `Chargers`
- `Headphones`
- `Earbuds`
- `Smartwatches`
- `Screen Protectors`
- `Cables`
- `Other Accessories`

## Category-Specific Details Fields

The `details` field is a required object that varies based on the selected category. Each category has specific required fields:

### Mobile Phone (`Mobile Phone`)
```json
{
  "brand": "String (required)",
  "model": "String (required)",
  "storage": "String (required)",
  "ram": "String (required)",
  "color": "String (required)",
  "screenSize": "String (required)",
  "batteryCapacity": "String (required)",
  "processor": "String (required)",
  "camera": "String (required)",
  "operatingSystem": "String (required)"
}
```

### Preowned Phones (`Preowned Phones`)
```json
{
  "brand": "String (required)",
  "model": "String (required)",
  "condition": "String (required)",
  "storage": "String (required)",
  "ram": "String (required)",
  "color": "String (required)",
  "batteryHealth": "String (required)",
  "warranty": "String (required)"
}
```

### Laptops (`Laptops`)
```json
{
  "brand": "String (required)",
  "model": "String (required)",
  "processor": "String (required)",
  "ram": "String (required)",
  "storage": "String (required)",
  "display": "String (required)",
  "graphics": "String (required)",
  "operatingSystem": "String (required)"
}
```

### Chargers (`Chargers`)
```json
{
  "brand": "String (required)",
  "type": "String (required)",
  "wattage": "String (required)",
  "compatibility": "String (required)",
  "color": "String (required)",
  "cableLength": "String (required)",
  "material": "String (required)"
}
```

### Phone Covers (`Phone Covers`)
```json
{
  "brand": "String (required)",
  "type": "String (required)",
  "compatibility": "String (required)",
  "color": "String (required)",
  "material": "String (required)"
}
```

### Headphones (`Headphones`)
```json
{
  "brand": "String (required)",
  "model": "String (required)",
  "type": "String (required)",
  "connectivity": "String (required)",
  "noiseCancellation": "String (required)",
  "batteryLife": "String (required)",
  "color": "String (required)",
  "driverSize": "String (required)"
}
```

### Earbuds (`Earbuds`)
```json
{
  "brand": "String (required)",
  "model": "String (required)",
  "type": "String (required)",
  "connectivity": "String (required)",
  "noiseCancellation": "String (required)",
  "batteryLife": "String (required)",
  "color": "String (required)",
  "waterResistance": "String (required)"
}
```

### Smartwatches (`Smartwatches`)
```json
{
  "brand": "String (required)",
  "model": "String (required)",
  "screenType": "String (required)",
  "caseMaterial": "String (required)",
  "waterResistance": "String (required)",
  "batteryLife": "String (required)",
  "operatingSystem": "String (required)"
}
```

### Screen Protectors (`Screen Protectors`)
```json
{
  "brand": "String (required)",
  "type": "String (required)",
  "compatibility": "String (required)",
  "features": "String (required)",
  "material": "String (required)"
}
```

### Cables (`Cables`)
```json
{
  "brand": "String (required)",
  "type": "String (required)",
  "length": "String (required)",
  "compatibility": "String (required)",
  "color": "String (required)",
  "material": "String (required)"
}
```

### Other Accessories (`Other Accessories`)
```json
{
  "brand": "String (required)",
  "type": "String (required)",
  "compatibility": "String (required)",
  "color": "String (required)",
  "material": "String (required)"
}
```

**Note:** For main categories (`Electronics`, `Mobile Accessories`, `Pre-owned Devices`, `Other`), the `details` field is still required but can be an empty object `{}` or contain any custom fields.

## Auto-Generated Fields

These fields are automatically generated by the system and do not need to be provided:

| Field | Type | Generated By | Description |
|-------|------|--------------|-------------|
| `productId` | String | `generateProductId()` | Unique product ID (format: PID-XXXXX) |
| `slug` | String | `generateSlug()` | URL-friendly slug generated from product name |
| `createdAt` | Date | Mongoose | Timestamp when product was created |

## Reviews Field (Read-Only)

The `reviews` field is automatically managed by the system when customers leave reviews. Do not include this field when creating a product.

## Complete Example: Product with Variations

```json
{
  "name": "iPhone 13",
  "category": "Mobile Phone",
  "price": 140000,
  "discountPrice": 135000,
  "description": "Latest iPhone with advanced features",
  "longDescription": "Detailed description of the iPhone 13...",
  "images": [
    "/uploads/iphone13-main-1.jpg",
    "/uploads/iphone13-main-2.jpg"
  ],
  "stock": 0,
  "hasVariations": true,
  "variations": [
    {
      "attributes": {
        "storage": "128GB",
        "color": "Midnight"
      },
      "stock": 10,
      "price": 140000,
      "discountPrice": 135000,
      "images": ["/uploads/iphone13-midnight-128gb.jpg"],
      "sku": "IPHONE-13-128GB-MIDNIGHT"
    },
    {
      "attributes": {
        "storage": "128GB",
        "color": "Pink"
      },
      "stock": 5,
      "price": 140000,
      "discountPrice": 135000,
      "images": ["/uploads/iphone13-pink-128gb.jpg"],
      "sku": "IPHONE-13-128GB-PINK"
    },
    {
      "attributes": {
        "storage": "256GB",
        "color": "Blue"
      },
      "stock": 8,
      "price": 145000,
      "discountPrice": 140000,
      "images": ["/uploads/iphone13-blue-256gb.jpg"],
      "sku": "IPHONE-13-256GB-BLUE"
    }
  ],
  "details": {
    "brand": "Apple",
    "model": "iPhone 13",
    "storage": "128GB / 256GB",
    "ram": "4GB",
    "color": "Multiple",
    "screenSize": "6.1 inches",
    "batteryCapacity": "3240 mAh",
    "processor": "A15 Bionic",
    "camera": "12MP Dual Camera",
    "operatingSystem": "iOS 15"
  },
  "warrantyPeriod": "1 Year",
  "kokoPay": true,
  "isNewArrival": true,
  "newArrivalOrder": 1
}
```

## Complete Example: Product without Variations

```json
{
  "name": "Apple AirPods Pro",
  "category": "Earbuds",
  "price": 45000,
  "discountPrice": 42000,
  "description": "Premium wireless earbuds with noise cancellation",
  "images": [
    "/uploads/airpods-pro-main.jpg"
  ],
  "stock": 25,
  "hasVariations": false,
  "details": {
    "brand": "Apple",
    "model": "AirPods Pro",
    "type": "True Wireless",
    "connectivity": "Bluetooth 5.0",
    "noiseCancellation": "Active Noise Cancellation",
    "batteryLife": "Up to 24 hours",
    "color": "White",
    "waterResistance": "IPX4"
  },
  "warrantyPeriod": "1 Year",
  "kokoPay": false
}
```

## Notes

1. **Stock Field**: 
   - If `hasVariations = true`, the main `stock` field is ignored, and stock is calculated from individual variations.
   - If `hasVariations = false`, the main `stock` field is used.

2. **Images**:
   - Main product images are stored in the `images` array.
   - Variation-specific images are stored in each variation's `images` array.
   - Image paths should be relative to the uploads directory (e.g., `/uploads/filename.jpg`).

3. **Variations Attributes**:
   - Attribute keys can be anything (e.g., "storage", "color", "size", "length").
   - Attribute values should be strings.
   - All attributes must be selected for a variation to be valid.

4. **Category-Specific Fields**:
   - Make sure to include all required fields for the selected category in the `details` object.
   - Fields like "storage" and "color" are removed from category-specific details when variations are enabled (they're managed via variations instead).

5. **Legacy Support**:
   - The `variants` field is kept for backward compatibility but should not be used with the new variations system.
   - Use `variations` instead of `variants` for new products.
