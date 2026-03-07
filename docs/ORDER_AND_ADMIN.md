# Order Process & Admin Permissions

## Order Process

### 1. Placing an order (Customer)
- Customer must have **profile completed**: state (emirate) and delivery address.
- From the landing or offer page, customer clicks **Order** on a product, fills quantity/notes/optional promo, and submits.
- **Delivery cost** is computed from the offer’s fee schedule: `qty_fee` (for 1–4 units) + `state_extra`; for 5+ units, `qty_fee` is 0.
- Order is created with status **`ordered`**.
- An **email notification** is sent to the configured notification address (if mail is set up). If email fails, staff can still see the order in **Order History** on the site.

### 2. After delivery (Customer)
- Customer goes to **My Orders** and sees the order with status “Awaiting delivery — please upload receipt”.
- Customer **uploads a receipt** (image or PDF). Status becomes **`delivered`**, statistics are updated, and a receipt notification email may be sent.
- If the wrong file was uploaded, customer can click **“Remove receipt & re-upload”**: the receipt is deleted, status returns to **`ordered`**, statistics are adjusted, and they can upload again.
- Customer can **view the receipt** (opens in a new tab via the API; no public storage link required).
- Optionally, customer can **submit feedback** after delivery.

### 3. Staff / Admin view
- **Order History** (Staff panel → Order History): list of all orders. For each order:
  - **Order text**: same content as the notification email (order number, code, date, customer info, product, total, marketer fee, notes). **Copy** button to copy this text.
  - **Receipt**: “View receipt” opens the file in a new tab. If no receipt yet, it shows “Receipt not uploaded yet”.
- Staff can use this page to check orders and receipts even when email was not received.

### 4. Deleting an order (Admin only)
- In **Order History**, only **admin** sees the **“Delete order”** button per order.
- Deleting an order: removes the order row, deletes the receipt file from storage, and (if the order was delivered) reverses the statistics (successful count, cumulative total, cumulative marketer fee).
- Customers and staff cannot delete orders; only admin can.

---

## Roles & Permissions

### Customer
- Register, login, profile (state, address, etc.).
- Browse offers and products, add to favorites, place orders.
- **My Orders**: view own orders, upload receipt, remove receipt & re-upload, view receipt, submit feedback.
- Cannot see other users’ orders or any admin/staff areas.

### Staff
- Everything below, plus:
  - **Staff panel** (dashboard, links to all staff pages).
  - **Manage offers** and **manage products** (create, edit, delete).
  - **Ad board** and **How it works** editors.
  - **Notifications**: overdue orders.
  - **Order History**: view all orders with order text and receipt per order; copy order text.
  - **Statistics**: view stats and marketer fee details; toggle commission collected per order.
  - **User management**: list/create/delete **customers** and reset their passwords (staff cannot manage other staff or admin).
- Staff **cannot**: delete orders, change system settings (e.g. notification email), or manage staff/admin users.

### Admin
- Everything staff can do, plus:
  - **Delete any order** from Order History (removes order, receipt file, and reverses stats if delivered).
  - **System settings** (e.g. notification email for order and receipt emails).
  - **User management** includes **staff and customers** (create staff, delete users, reset passwords).

---

## Summary Table

| Action                         | Customer | Staff | Admin |
|--------------------------------|----------|-------|-------|
| Place order                    | ✓        | ✓     | ✓     |
| My orders, upload/view/remove receipt | ✓ | ✓     | ✓     |
| Order History (all orders + receipts) | — | ✓     | ✓     |
| Copy order text                | —        | ✓     | ✓     |
| Statistics, toggle commission  | —        | ✓     | ✓     |
| Manage offers/products, board, how-it-works | — | ✓ | ✓     |
| Manage users (customers)       | —        | ✓     | ✓     |
| Manage users (staff)           | —        | —     | ✓     |
| Delete order                   | —        | —     | ✓     |
| System settings                | —        | —     | ✓     |
