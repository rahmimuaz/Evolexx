# How to Add Cable Products with Length Variations

## Example: Apple Type C to Lightning Cable (1m, 2m, 6m)

### Step 1: Basic Product Information

1. **Go to Admin Panel** → Inventory → Add Product

2. **Fill in Basic Information:**
   - **Product Name:** `Apple Type C to Lightning Cable`
   - **Category:** `Mobile Accessories`
   - **Subcategory:** `Cables` ← This is important!
   - **Brand:** `Apple` (or your brand)
   - **Price:** `Rs. 2,500` (base price)
   - **Description:** `Original Apple Type C to Lightning Cable...`

### Step 2: Enable Variations

1. **Scroll down to "Price, Stock & Variants" section**

2. **Check the checkbox:** ✅ **"This product has variations"**
   - This is the checkbox you see in your screenshot!

3. **⚠️ IMPORTANT - Check the Table Header:**
   - **After checking the box, look at the variations table header**
   - ✅ **Correct for Cables:** Should show **"Type / Length / Color"**
   - ❌ **Wrong:** If it shows **"Storage / Color"**, you need to:
     1. **Go back and select Subcategory: `Cables` first** (in Step 1)
     2. Then uncheck and recheck the "This product has variations" checkbox
     3. The attributes will update automatically

4. **Why this happens:**
   - The system auto-suggests attributes based on **Subcategory**
   - If you check variations BEFORE selecting subcategory, it uses default attributes
   - **Always select Subcategory FIRST, then enable variations!**

5. **Customize Attributes (optional):**
   - Currently, Add Product page doesn't have a visible UI to add/remove attributes
   - It auto-suggests based on subcategory
   - For cables, it will suggest: `type`, `length`, `color`
   - You can use all three or just focus on `type` and `length` in your variations

### Step 3: Verify Attributes (Check Table Header)

**Look at the variations table header:**
- ✅ **Correct for Cables:** Should show "Type / Length / Color"
- ❌ **Wrong:** If it shows "Storage / Color", you need to:
  1. Select Subcategory: `Cables` first
  2. Refresh or uncheck/recheck variations checkbox

### Step 4: Create Variations

Now add each cable length as a separate variation:

#### Variation 1: 1 Meter Cable
1. Click **"+ Add Variation"** (or the system may create a row automatically)
2. Fill in the variation row:
   - **Type:** `Apple Type C to Lightning`
   - **Length:** `1m` (or `1 meter`)
   - **Price:** `Rs. 2,500` (or leave empty to use base price)
   - **Special Price:** (optional, e.g., `Rs. 2,200` for discount)
   - **Stock:** `10` (or your stock quantity)
   - **Image:** (optional - upload image if you have specific images per length)

#### Variation 2: 2 Meter Cable
1. Click **"+ Add Variation"** again
2. Fill in:
   - **Type:** `Apple Type C to Lightning`
   - **Length:** `2m` (or `2 meter`)
   - **Price:** `Rs. 3,000` (2m cables are usually more expensive)
   - **Special Price:** (optional)
   - **Stock:** `15`
   - **Image:** (optional)

#### Variation 3: 6 Meter Cable
1. Click **"+ Add Variation"** again
2. Fill in:
   - **Type:** `Apple Type C to Lightning`
   - **Length:** `6m` (or `6 meter`)
   - **Price:** `Rs. 4,500` (longest cable, highest price)
   - **Special Price:** (optional)
   - **Stock:** `8`
   - **Image:** (optional)

### Step 4: Review and Publish

1. Review all variations in the table
2. Make sure all required fields are filled
3. Click **"Publish Product"**

---

## How It Will Appear on Client Side

### For Customers:

**Product Page will show:**

```
Select Type
[Apple Type C to Lightning]  ← Selected

Select Length
[1m] [2m] [6m]  ← All lengths visible, user selects one
```

**When user selects a length:**
- Price updates automatically (if different prices per length)
- Stock shows availability for that specific length
- User can add to cart with the selected length

---

## Example Variations Table (Admin Panel)

| Type | Length | Price | Special Price | Stock | Image |
|------|--------|-------|---------------|-------|-------|
| Apple Type C to Lightning | 1m | 2500 | 2200 | 10 | [Upload] |
| Apple Type C to Lightning | 2m | 3000 | 2800 | 15 | [Upload] |
| Apple Type C to Lightning | 6m | 4500 | 4200 | 8 | [Upload] |

---

## Advanced: Multiple Cable Types

If you want to sell multiple cable types (e.g., Type C to Lightning, Type C to Type C, etc.):

### Option 1: Separate Products (Recommended)
- Create separate products for each cable type
- Each product has length variations (1m, 2m, 6m)

### Option 2: Single Product with Multiple Types
- Keep both `type` and `length` attributes
- Create variations for all combinations:
  - Type C to Lightning + 1m
  - Type C to Lightning + 2m
  - Type C to Lightning + 6m
  - Type C to Type C + 1m
  - Type C to Type C + 2m
  - Type C to Type C + 6m
  - etc.

**Example Variations:**
| Type | Length | Price | Stock |
|------|--------|-------|-------|
| Apple Type C to Lightning | 1m | 2500 | 10 |
| Apple Type C to Lightning | 2m | 3000 | 15 |
| Apple Type C to Lightning | 6m | 4500 | 8 |
| Apple Type C to Type C | 1m | 2000 | 12 |
| Apple Type C to Type C | 2m | 2500 | 18 |
| Apple Type C to Type C | 6m | 4000 | 5 |

**On Client Side:**
```
Select Type
[Apple Type C to Lightning] [Apple Type C to Type C]

Select Length
[1m] [2m] [6m]  ← Filters based on selected type
```

---

## Tips

1. **Consistent Naming:**
   - Use consistent length format: `1m`, `2m`, `6m` (not `1 meter`, `2 meters`, etc.)
   - Or use: `1 meter`, `2 meters`, `6 meters` (be consistent)

2. **Pricing:**
   - Longer cables usually cost more
   - Set different prices per length if needed
   - Or use base price if all lengths are same price

3. **Stock Management:**
   - Track stock per length separately
   - System automatically calculates total stock

4. **Images:**
   - You can upload different images per length if you have them
   - Or use the same product image for all variations

5. **SKU (Optional):**
   - You can add SKU per variation for inventory tracking
   - Format: `APPLE-C2L-1M`, `APPLE-C2L-2M`, `APPLE-C2L-6M`

---

## Quick Reference

**Category:** Mobile Accessories  
**Subcategory:** Cables  
**Suggested Attributes:** `type`, `length`, `color`  
**Your Use Case:** `type` + `length` (remove `color` if not needed)

**Variation Attributes:**
- `type`: Cable type (e.g., "Apple Type C to Lightning")
- `length`: Cable length (e.g., "1m", "2m", "6m")
- `color`: (optional) Cable color

---

## Example: Complete Setup

**Product Name:** Apple Type C to Lightning Cable  
**Category:** Mobile Accessories  
**Subcategory:** Cables  
**Brand:** Apple  
**Base Price:** Rs. 2,500  

**Variations:**
1. Type: `Apple Type C to Lightning`, Length: `1m`, Price: `Rs. 2,500`, Stock: `10`
2. Type: `Apple Type C to Lightning`, Length: `2m`, Price: `Rs. 3,000`, Stock: `15`
3. Type: `Apple Type C to Lightning`, Length: `6m`, Price: `Rs. 4,500`, Stock: `8`

**Result:** Customers can select length (1m, 2m, or 6m) and see the correct price and stock for their selection! 🎉
