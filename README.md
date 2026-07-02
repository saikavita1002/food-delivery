# Food Delivery Management System — Backend

MERN-stack backend for an online food ordering platform. Express + MongoDB + JWT auth + Multer image uploads.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then edit MONGO_URI and JWT_SECRET
npm run dev            # nodemon, restarts on file change
# or
npm start
```

Requires a running MongoDB instance (local `mongod` or a MongoDB Atlas connection string).

## Sample data (optional but recommended)

To populate the database with realistic sample users, restaurants, food items, a cart, and orders for demoing or exploring in MongoDB Compass:

```bash
npm run seed
```

This clears and repopulates the 5 collections — safe to re-run anytime. It prints test login credentials (1 admin, 2 restaurant owners, 2 customers) when done. See `MONGODB_COMPASS_GUIDE.md` for how to view this data visually.

## Roles

Three roles exist on the `User` model: `user`, `restaurant_owner`, `admin`.
- `user` — browses, orders, manages own profile/cart.
- `restaurant_owner` — everything a `user` can do, plus manage their own restaurant(s), menu items, and incoming orders.
- `admin` — can manage any restaurant/food/order regardless of ownership. **Not assignable via public registration** — set manually in the database after creating the account.

## API Reference

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Create account (role limited to `user`/`restaurant_owner`) |
| POST | `/login` | Public | Returns JWT |
| GET | `/profile` | Bearer token | Current user's profile |
| PUT | `/profile` | Bearer token | Update name/mobile/address |
| PUT | `/change-password` | Bearer token | Body: `{ currentPassword, newPassword }` |

### Restaurants (`/api/restaurants`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | List active restaurants |
| GET | `/:id` | Public | Restaurant details + its available menu |
| POST | `/` | owner/admin | multipart form, field `image` |
| PUT | `/:id` | owner of that restaurant/admin | Update |
| DELETE | `/:id` | owner of that restaurant/admin | Delete |

### Foods (`/api/foods`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q=` | Public | Text search by name/category |
| GET | `/?restaurantId=` | Public | List foods, optional restaurant filter |
| GET | `/:id` | Public | Single food item |
| POST | `/` | owner/admin | multipart form, field `image` |
| PUT | `/:id` | owner of parent restaurant/admin | Update |
| DELETE | `/:id` | owner of parent restaurant/admin | Delete |

### Cart (`/api/cart`) — all routes require login
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get current user's cart |
| POST | `/add` | Body: `{ foodId, quantity }` |
| PUT | `/update` | Body: `{ foodId, quantity }` |
| DELETE | `/remove/:foodId` | Remove one item line |

### Orders (`/api/orders`) — all routes require login
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | user | Places order from current cart. Body: `{ deliveryAddress }` |
| GET | `/user/:id` | self/admin | Order history for a user |
| GET | `/restaurant/:id` | owner/admin | Incoming orders for a restaurant |
| GET | `/:id` | order owner/admin | Single order detail |
| PUT | `/status/:id` | restaurant owner/admin | Body: `{ status }` — one of Pending, Preparing, Out for Delivery, Delivered, Cancelled |

## Design notes (useful for interview Q&A)

- **Password security**: bcrypt hash via a Mongoose `pre('save')` hook; `password` field is `select: false` so it's never returned by default and must be explicitly requested with `.select('+password')` during login/change-password.
- **Order price snapshotting**: `Order.items` stores `foodName` and `price` at the time of purchase, separate from the live `Food` document. This means a later menu price change never alters historical order totals.
- **Cart → Order flow**: `POST /api/orders` reads the user's cart, validates all items belong to one restaurant, builds the snapshot, computes `totalAmount` server-side (never trusts a client-sent total), creates the order, then empties the cart.
- **Authorization layering**: `protect` (verifies JWT) runs before `authorize(...roles)` (checks role) which runs before ownership checks inside the controller (e.g., a `restaurant_owner` can only edit *their own* restaurant, verified via `restaurant.ownerId`).
