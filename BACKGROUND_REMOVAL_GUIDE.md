# Background Removal Feature - Implementation Guide

## Overview

This guide explains how to implement automatic background removal for product
images when users create listings, similar to Vestaire's functionality.

## Current Implementation

- Images are uploaded via `/api/auth/upload-image/` endpoint
- Upload happens in `ListItemForm.tsx` component (lines 258-285)
- Images are processed sequentially before product creation
- Current flow: Upload → Get URL → Create Product

## Recommended Approach

### Option 1: Backend Processing (Recommended)

**Process images on the server after upload, before storing**

**Flow:**

1. User uploads image → Backend receives image
2. Backend calls background removal API
3. Backend stores processed image
4. Returns processed image URL to frontend

**Pros:**

- More secure (API keys stay on server)
- Better error handling
- Can add retry logic
- Can cache results
- User doesn't wait for processing

**Cons:**

- Requires backend changes
- Slightly more complex

### Option 2: Frontend Processing (Not Recommended)

**Process images in browser before upload**

**Pros:**

- No backend changes needed
- Immediate feedback

**Cons:**

- API keys exposed in frontend (security risk)
- Slower user experience
- Higher client-side processing costs
- Not suitable for production

## Available Background Removal Services

### 1. Remove.bg API ⭐ (Most Popular)

- **Website:** https://www.remove.bg/api
- **Pricing:**
  - Free: 50 images/month
  - Basic: $0.02/image (up to 1,000/month)
  - Pro: $0.01/image (unlimited)
- **API Quality:** Excellent
- **Speed:** ~2-5 seconds per image
- **Features:** High-quality removal, edge refinement, shadow retention

### 2. PhotoRoom API

- **Website:** https://www.photoroom.com/api/
- **Pricing:**
  - Free: 50 images/month
  - Starter: $0.05/image
  - Pro: $0.02/image (bulk discounts available)
- **API Quality:** Excellent
- **Speed:** ~3-6 seconds per image
- **Features:** Professional quality, white background option, shadow control

### 3. Clipdrop API

- **Website:** https://clipdrop.co/api
- **Pricing:**
  - Free: 100 images/month
  - Pro: $0.10/image or subscription plans
- **API Quality:** Very Good
- **Speed:** ~2-4 seconds per image
- **Features:** Fast processing, good API documentation

### 4. Slazzer API

- **Website:** https://www.slazzer.com/api
- **Pricing:**
  - Free: 10 images/month
  - Basic: $0.10/image
  - Pro: $0.05/image (volume discounts)
- **API Quality:** Good
- **Speed:** ~3-5 seconds per image
- **Features:** E-commerce focused, batch processing

### 5. Erase.bg API

- **Website:** https://www.erase.bg/api
- **Pricing:**
  - Free: 50 images/month
  - Paid: $0.02/image
- **API Quality:** Good
- **Speed:** ~2-4 seconds per image
- **Features:** Simple API, good documentation

## Recommended Service: Remove.bg

**Why Remove.bg:**

- Most popular and reliable
- Best price-to-quality ratio ($0.01/image at scale)
- Excellent API documentation
- Fast processing (2-5 seconds)
- Good error handling
- Free tier for testing (50 images/month)

## Implementation Time Estimates

### Backend Implementation (Recommended)

**Time: 3-5 days**

**Breakdown:**

1. **Day 1:** Research and setup

   - Choose service (Remove.bg recommended)
   - Create account and get API key
   - Test API with sample images
   - Set up environment variables

2. **Day 2-3:** Backend integration

   - Modify `/api/auth/upload-image/` endpoint
   - Add background removal function
   - Handle errors and retries
   - Add image optimization (optional)

3. **Day 4:** Testing and optimization

   - Test with various image types
   - Handle edge cases (very large images, complex backgrounds)
   - Add caching if needed
   - Performance optimization

4. **Day 5:** Frontend updates (if needed)
   - Add loading states
   - Update UI to show processing status
   - Handle errors gracefully

### Frontend Implementation (Not Recommended)

**Time: 2-3 days** (but not secure for production)

## Implementation Steps (Backend Approach)

### Step 1: Choose Service & Get API Key

1. Sign up for Remove.bg API
2. Get API key from dashboard
3. Add to backend environment variables:
   ```env
   REMOVE_BG_API_KEY=your_api_key_here
   ```

### Step 2: Install Required Packages (Backend)

```bash
# Python example (if using Django/Flask)
pip install requests pillow

# Node.js example (if using Express)
npm install axios sharp
```

### Step 3: Modify Upload Endpoint

**Current flow:**

```
Upload → Store → Return URL
```

**New flow:**

```
Upload → Remove Background → Store → Return URL
```

### Step 4: Add Background Removal Function

**Python Example:**

```python
import requests
import os

def remove_background(image_path):
    response = requests.post(
        'https://api.remove.bg/v1.0/removebg',
        files={'image_file': open(image_path, 'rb')},
        data={'size': 'auto'},
        headers={'X-Api-Key': os.getenv('REMOVE_BG_API_KEY')},
    )

    if response.status_code == 200:
        return response.content  # Processed image bytes
    else:
        raise Exception(f"Background removal failed: {response.text}")
```

**Node.js Example:**

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function removeBackground(imagePath) {
  const formData = new FormData();
  formData.append('image_file', fs.createReadStream(imagePath));
  formData.append('size', 'auto');

  const response = await axios.post(
    'https://api.remove.bg/v1.0/removebg',
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Key': process.env.REMOVE_BG_API_KEY,
      },
      responseType: 'arraybuffer',
    }
  );

  return response.data; // Processed image buffer
}
```

### Step 5: Update Upload Endpoint

1. Receive uploaded image
2. Call background removal function
3. Save processed image (with white/transparent background)
4. Return processed image URL

### Step 6: Error Handling

- Handle API failures gracefully
- Fallback to original image if removal fails
- Log errors for monitoring
- Add retry logic for transient failures

### Step 7: Frontend Updates (Optional)

- Show "Processing image..." message
- Display progress for multiple images
- Handle timeout scenarios

## Cost Estimates

### Monthly Costs (Example)

**Scenario: 1,000 product listings/month, average 3 images each = 3,000
images/month**

- **Remove.bg Pro:** $30/month (3,000 × $0.01)
- **PhotoRoom Pro:** $60/month (3,000 × $0.02)
- **Clipdrop:** $300/month (3,000 × $0.10)

**Recommendation:** Start with Remove.bg free tier (50 images) for testing, then
upgrade to Pro plan.

## Performance Considerations

### Processing Time

- **Per image:** 2-5 seconds
- **For 3 images:** 6-15 seconds total
- **Recommendation:** Process images in parallel (if multiple) or show progress

### User Experience

- Show loading indicator during processing
- Process images asynchronously if possible
- Allow user to continue with other form fields while processing

### Caching Strategy

- Cache processed images to avoid reprocessing
- Store original + processed versions
- Allow users to revert to original if needed

## Alternative: Client-Side Processing (Not Recommended for Production)

If you must process on frontend (not recommended):

1. Use Remove.bg JavaScript SDK
2. Process before upload
3. **Security Issue:** API key exposed in frontend code
4. **Solution:** Use a proxy endpoint that forwards requests

## Testing Checklist

- [ ] Test with various image types (JPG, PNG, WebP)
- [ ] Test with different image sizes
- [ ] Test with complex backgrounds
- [ ] Test with simple backgrounds
- [ ] Test with multiple images
- [ ] Test error handling (API failures)
- [ ] Test timeout scenarios
- [ ] Verify white background output
- [ ] Check image quality after processing
- [ ] Test on mobile devices

## Security Best Practices

1. **Never expose API keys in frontend**
2. Store API keys in environment variables
3. Add rate limiting to prevent abuse
4. Validate image file types and sizes
5. Monitor API usage and costs
6. Set up alerts for unusual usage

## Monitoring & Maintenance

1. **Track API usage:** Monitor number of images processed
2. **Monitor costs:** Set up billing alerts
3. **Track errors:** Log failed removals
4. **Performance:** Monitor processing times
5. **Quality:** Periodically review processed images

## Next Steps

1. **Choose service:** Remove.bg recommended
2. **Get API key:** Sign up and get credentials
3. **Test API:** Process a few sample images
4. **Plan backend changes:** Identify where to integrate
5. **Implement:** Follow steps above
6. **Test thoroughly:** Use testing checklist
7. **Deploy:** Start with free tier, monitor usage
8. **Scale:** Upgrade plan as needed

## Questions to Consider

1. **Do you want white background or transparent?**

   - White: Better for e-commerce, consistent look
   - Transparent: More flexible, allows custom backgrounds

2. **Should users be able to revert to original?**

   - Store both versions
   - Add "Use original" option in edit mode

3. **Process all images or just first/main image?**

   - All images: Better consistency, higher cost
   - Main image only: Lower cost, faster processing

4. **Synchronous or asynchronous processing?**
   - Synchronous: User waits, simpler UX
   - Asynchronous: Better UX, more complex

## Support & Resources

- **Remove.bg API Docs:** https://www.remove.bg/api
- **PhotoRoom API Docs:** https://www.photoroom.com/api/
- **Clipdrop API Docs:** https://clipdrop.co/api

---

**Estimated Total Implementation Time: 3-5 days** **Recommended Monthly Budget:
$30-60 for 3,000 images/month** **Best Service: Remove.bg (best price/quality
ratio)**

