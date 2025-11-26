# Shipment & Order Management API Documentation

This document describes the APIs for managing orders and shipments for both
buyers and sellers.

---

## Table of Contents

1. [Buyer APIs](#buyer-apis)
2. [Seller APIs](#seller-apis)
3. [Order Status Flow](#order-status-flow)
4. [Integration Examples](#integration-examples)

---

## Buyer APIs

### 1. Get My Orders

**Endpoint:** `GET /api/user/orders/`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): Filter by order status (`pending`, `ready`, `shipped`,
  `reached_at_courier`, `out_for_delivery`, `delivered`, `cancelled`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**

```
GET /api/user/orders/?status=pending&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "orders": [
    {
      "id": "order_id_1",
      "orderNumber": "ORD-ABC123XYZ",
      "product": {
        "id": "product_id",
        "title": "Product Title",
        "images": ["https://example.com/image1.jpg"],
        "price": 99.99
      },
      "seller": {
        "id": "seller_id",
        "username": "seller_username",
        "profileImage": "https://example.com/profile.jpg"
      },
      "orderDate": "2024-01-15T10:30:00Z",
      "status": "pending",
      "paymentStatus": "completed",
      "totalPrice": 109.99,
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "+1234567890",
        "address": "123 Main Street",
        "city": "New York",
        "postalCode": "10001",
        "country": "USA",
        "additionalInfo": "Apt 4B"
      },
      "trackingNumber": ""
    },
    {
      "id": "order_id_2",
      "orderNumber": "ORD-DEF456UVW",
      "product": {
        "id": "product_id_2",
        "title": "Another Product",
        "images": ["https://example.com/image2.jpg"],
        "price": 149.99
      },
      "seller": {
        "id": "seller_id_2",
        "username": "another_seller",
        "profileImage": "https://example.com/profile2.jpg"
      },
      "orderDate": "2024-01-14T14:20:00Z",
      "status": "shipped",
      "paymentStatus": "completed",
      "totalPrice": 159.99,
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "+1234567890",
        "address": "123 Main Street",
        "city": "New York",
        "postalCode": "10001",
        "country": "USA",
        "additionalInfo": "Apt 4B"
      },
      "trackingNumber": "TRACK123456"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 2
  }
}
```

**Use Cases:**

- Display list of all orders (pending and completed)
- Filter orders by status
- Show order summary with product image, title, price
- Display order status and payment status

---

### 2. Get Order Details

**Endpoint:** `GET /api/user/orders/{order_id}/`

**Headers:**

```
Authorization: Bearer <token>
```

**Example Request:**

```
GET /api/user/orders/507f1f77bcf86cd799439011/
```

**Response (200 OK):**

```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-ABC123XYZ",
    "orderDate": "2024-01-15T10:30:00Z",
    "status": "shipped",
    "paymentStatus": "completed",
    "product": {
      "id": "product_id",
      "title": "Product Title",
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "price": 99.99,
      "originalPrice": 129.99
    },
    "pricing": {
      "productPrice": 99.99,
      "offerPrice": 95.0,
      "shippingCost": 10.0,
      "platformFee": 2.5,
      "totalPrice": 107.5
    },
    "shipping": {
      "address": "123 Main Street",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "city": "New York",
      "postalCode": "10001",
      "country": "USA",
      "additionalInfo": "Apt 4B",
      "trackingNumber": "TRACK123456",
      "status": "shipped"
    },
    "payment": {
      "status": "completed",
      "paymentId": "payment_123456",
      "totalPaid": 107.5
    },
    "seller": {
      "id": "seller_id",
      "username": "seller_username",
      "fullName": "Seller Name",
      "profileImage": "https://example.com/profile.jpg"
    },
    "offer": {
      "id": "offer_id",
      "offerAmount": 95.0,
      "originalPrice": 99.99,
      "status": "accepted"
    }
  }
}
```

**Use Cases:**

- Show detailed order page when user clicks on an order
- Display complete order information including:
  - Product details with images
  - Pricing breakdown
  - Shipping address and tracking
  - Payment information
  - Seller information
  - Offer details (if order was from an offer)

**Error Responses:**

- `404 Not Found`: Order not found
- `400 Bad Request`: Unauthorized access (not buyer or seller of this order)

---

## Seller APIs

### 1. Get My Orders (Payments)

**Endpoint:** `GET /api/user/payments/`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `status` (optional): Filter by order status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Example Request:**

```
GET /api/user/payments/?status=ready&page=1&limit=20
```

**Response (200 OK):**

```json
{
  "payments": [
    {
      "id": "order_id_1",
      "orderNumber": "ORD-ABC123XYZ",
      "product": {
        "id": "product_id",
        "title": "Product Title",
        "images": ["https://example.com/image1.jpg"],
        "price": 99.99
      },
      "buyer": {
        "id": "buyer_id",
        "username": "buyer_username",
        "profileImage": "https://example.com/buyer_profile.jpg"
      },
      "orderDate": "2024-01-15T10:30:00Z",
      "status": "ready",
      "paymentStatus": "completed",
      "totalPrice": 109.99,
      "platformFee": 2.5,
      "sellerPayout": 107.49,
      "affiliateCode": "AFF123",
      "shippingAddress": {
        "fullName": "John Doe",
        "phone": "+1234567890",
        "address": "123 Main Street",
        "city": "New York",
        "postalCode": "10001",
        "country": "USA",
        "additionalInfo": "Apt 4B"
      },
      "trackingNumber": ""
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1
  }
}
```

**Use Cases:**

- Display list of all orders received by seller
- Filter orders by status (ready to ship, shipped, etc.)
- Show order summary with buyer information
- Display payout information

---

### 2. Get Order Details (Seller)

**Endpoint:** `GET /api/user/orders/{order_id}/`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-ABC123XYZ",
    "orderDate": "2024-01-15T10:30:00Z",
    "status": "ready",
    "paymentStatus": "completed",
    "product": {
      "id": "product_id",
      "title": "Product Title",
      "images": ["https://example.com/image1.jpg"],
      "price": 99.99,
      "originalPrice": 129.99
    },
    "pricing": {
      "productPrice": 99.99,
      "offerPrice": null,
      "shippingCost": 10.0,
      "platformFee": 2.5,
      "totalPrice": 109.99
    },
    "shipping": {
      "address": "123 Main Street",
      "fullName": "John Doe",
      "phone": "+1234567890",
      "city": "New York",
      "postalCode": "10001",
      "country": "USA",
      "additionalInfo": "Apt 4B",
      "trackingNumber": "",
      "status": "ready"
    },
    "payment": {
      "status": "completed",
      "paymentId": "payment_123456",
      "totalPaid": 109.99
    },
    "buyer": {
      "id": "buyer_id",
      "username": "buyer_username",
      "fullName": "John Doe",
      "profileImage": "https://example.com/buyer_profile.jpg"
    },
    "sellerPayout": 107.49,
    "affiliateCode": "AFF123"
  }
}
```

**Use Cases:**

- View complete order details before shipping
- See buyer's shipping address
- Check payment status
- View payout information

---

### 3. Update Order Status

**Endpoint:** `PUT /api/user/payments/{order_id}/update-status/`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

**Available Status Values:**

- `ready` - Order is ready to be shipped
- `shipped` - Order has been shipped
- `reached_at_courier` - Order reached courier facility
- `out_for_delivery` - Order is out for delivery
- `delivered` - Order has been delivered

**Example Requests:**

**1. Mark as Ready:**

```json
{
  "status": "ready"
}
```

**2. Mark as Shipped:**

```json
{
  "status": "shipped",
  "trackingNumber": "TRACK123456"
}
```

**3. Update to Reached at Courier:**

```json
{
  "status": "reached_at_courier",
  "trackingNumber": "TRACK123456"
}
```

**4. Update to Out for Delivery:**

```json
{
  "status": "out_for_delivery",
  "trackingNumber": "TRACK123456"
}
```

**5. Mark as Delivered:**

```json
{
  "status": "delivered",
  "trackingNumber": "TRACK123456"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-ABC123XYZ",
    "status": "shipped",
    "trackingNumber": "TRACK123456",
    "updatedAt": "2024-01-16T09:15:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid status or missing required fields
- `404 Not Found`: Order not found or seller doesn't have access

**Use Cases:**

- Update order status as it moves through shipping process
- Add tracking number when shipping
- Track order progress from ready → shipped → reached at courier → out for
  delivery → delivered

---

## Order Status Flow

### Status Progression

```
pending → ready → shipped → reached_at_courier → out_for_delivery → delivered
   ↓
cancelled (can happen at any time)
```

### Status Descriptions

1. **pending** - Order is created but payment is pending
2. **ready** - Payment completed, order is ready to be shipped by seller
3. **shipped** - Seller has shipped the order (tracking number added)
4. **reached_at_courier** - Order has reached courier facility
5. **out_for_delivery** - Order is out for delivery to buyer
6. **delivered** - Order has been successfully delivered
7. **cancelled** - Order has been cancelled

---

## Integration Examples

### Buyer Flow

#### 1. View All Orders

```javascript
// Get all orders (pending and completed)
const response = await fetch('/api/user/orders/', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Display orders list
```

#### 2. Filter Pending Orders

```javascript
// Get only pending orders
const response = await fetch('/api/user/orders/?status=pending', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Show pending orders
```

#### 3. View Order Details

```javascript
// When user clicks on an order
const orderId = 'order_id_123';
const response = await fetch(`/api/user/orders/${orderId}/`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Display order details page with:
// - Product information
// - Shipping details
// - Payment information
// - Tracking number (if available)
// - Order status
```

#### 4. Track Order Status

```javascript
// Check order status periodically
const checkOrderStatus = async orderId => {
  const response = await fetch(`/api/user/orders/${orderId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  // Update UI based on status
  switch (data.order.status) {
    case 'pending':
      // Show "Payment Pending"
      break;
    case 'ready':
      // Show "Preparing for Shipment"
      break;
    case 'shipped':
      // Show "Shipped" with tracking number
      break;
    case 'reached_at_courier':
      // Show "At Courier Facility"
      break;
    case 'out_for_delivery':
      // Show "Out for Delivery"
      break;
    case 'delivered':
      // Show "Delivered"
      break;
  }
};
```

---

### Seller Flow

#### 1. View All Orders (Payments)

```javascript
// Get all orders received
const response = await fetch('/api/user/payments/', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Display orders list with buyer information
```

#### 2. Filter Ready to Ship Orders

```javascript
// Get orders ready to ship
const response = await fetch('/api/user/payments/?status=ready', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Show orders that need to be shipped
```

#### 3. View Order Details Before Shipping

```javascript
// View order details to see shipping address
const orderId = 'order_id_123';
const response = await fetch(`/api/user/orders/${orderId}/`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const data = await response.json();
// Display:
// - Buyer shipping address
// - Product details
// - Payment status
// - Payout information
```

#### 4. Mark Order as Ready

```javascript
// When order is ready to ship
const orderId = 'order_id_123';
const response = await fetch(`/api/user/payments/${orderId}/update-status/`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'ready',
  }),
});
const data = await response.json();
// Order status updated to "ready"
```

#### 5. Ship Order

```javascript
// When seller ships the order
const orderId = 'order_id_123';
const trackingNumber = 'TRACK123456';
const response = await fetch(`/api/user/payments/${orderId}/update-status/`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'shipped',
    trackingNumber: trackingNumber,
  }),
});
const data = await response.json();
// Order status updated to "shipped" with tracking number
```

#### 6. Update Order Status (Reached at Courier)

```javascript
// When order reaches courier
const orderId = 'order_id_123';
const response = await fetch(`/api/user/payments/${orderId}/update-status/`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'reached_at_courier',
    trackingNumber: 'TRACK123456',
  }),
});
```

#### 7. Update Order Status (Out for Delivery)

```javascript
// When order is out for delivery
const orderId = 'order_id_123';
const response = await fetch(`/api/user/payments/${orderId}/update-status/`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'out_for_delivery',
    trackingNumber: 'TRACK123456',
  }),
});
```

#### 8. Mark Order as Delivered

```javascript
// When order is delivered
const orderId = 'order_id_123';
const response = await fetch(`/api/user/payments/${orderId}/update-status/`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'delivered',
    trackingNumber: 'TRACK123456',
  }),
});
```

---

## UI Integration Recommendations

### Buyer Order List Page

- Show all orders with status badges
- Display product image, title, price
- Show order date and status
- Click on order to view details

### Buyer Order Details Page

- Show complete product information
- Display shipping address
- Show payment status and amount paid
- Display tracking number (if available)
- Show order status with timeline:
  - ✅ Payment Completed
  - ✅ Order Confirmed
  - ⏳ Preparing for Shipment
  - ⏳ Shipped
  - ⏳ Reached at Courier
  - ⏳ Out for Delivery
  - ⏳ Delivered

### Seller Orders Page

- Show all received orders
- Filter by status (ready, shipped, etc.)
- Display buyer information
- Show payout amount
- Click to view order details

### Seller Order Details Page

- Show buyer shipping address
- Display product details
- Show payment status
- Update order status buttons:
  - "Mark as Ready"
  - "Mark as Shipped" (with tracking number input)
  - "Reached at Courier"
  - "Out for Delivery"
  - "Mark as Delivered"

### Seller Status Update Form

- Dropdown/buttons for status selection
- Tracking number input field (required for shipped status)
- Update button to submit changes

---

## Error Handling

### Common Errors

**401 Unauthorized:**

```json
{
  "success": false,
  "error": "Authentication required"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "error": "Order not found"
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "error": "Invalid status. Allowed statuses: ready, shipped, reached_at_courier, out_for_delivery, delivered"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "error": "Unauthorized: You don't have access to this order"
}
```

---

## Notes

1. **Tracking Number**: Required when status is `shipped` or later. Can be added
   or updated in subsequent status updates.

2. **Status Validation**: Only sellers can update order status. Status can only
   progress forward (cannot go back to previous status).

3. **Payment Status**: Separate from order status. Payment status indicates if
   payment is completed, while order status indicates shipping progress.

4. **Order Access**: Buyers can only see their own orders. Sellers can only see
   orders for their products.

5. **Pagination**: Use `page` and `limit` query parameters for pagination in
   order lists.

---

## Testing Checklist

### Buyer

- [ ] View all orders (pending and completed)
- [ ] Filter orders by status
- [ ] View order details
- [ ] See tracking number when order is shipped
- [ ] View payment information
- [ ] See order status updates

### Seller

- [ ] View all received orders
- [ ] Filter orders by status
- [ ] View order details with buyer address
- [ ] Mark order as ready
- [ ] Ship order with tracking number
- [ ] Update status to "reached at courier"
- [ ] Update status to "out for delivery"
- [ ] Mark order as delivered
- [ ] View payout information
