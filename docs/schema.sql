-- ============================================================
-- Veggio — PostgreSQL Schema
-- Run this manually, or let EF Core migrations handle it.
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- for fuzzy search

-- ── Users ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone         VARCHAR(20),
    address       VARCHAR(500),
    role          VARCHAR(20) NOT NULL DEFAULT 'Customer',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ── Vegetables ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vegetables (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           VARCHAR(100) NOT NULL,
    category       VARCHAR(50)  NOT NULL,
    price          DECIMAL(10,2) NOT NULL CHECK (price > 0),
    original_price DECIMAL(10,2),
    unit           VARCHAR(30)  NOT NULL DEFAULT 'kg',
    stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    description    VARCHAR(1000),
    nutrition_info VARCHAR(500),
    image_url      VARCHAR(2000),
    is_organic     BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured    BOOLEAN NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    discount       INTEGER,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_veg_category   ON vegetables(category);
CREATE INDEX IF NOT EXISTS idx_veg_is_active  ON vegetables(is_active);
CREATE INDEX IF NOT EXISTS idx_veg_is_featured ON vegetables(is_featured);
CREATE INDEX IF NOT EXISTS idx_veg_price      ON vegetables(price);
-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_veg_name_trgm  ON vegetables USING GIN (name gin_trgm_ops);

-- ── Orders ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    delivery_address VARCHAR(500) NOT NULL,
    phone            VARCHAR(20),
    notes            VARCHAR(500),
    total            DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    delivery_fee     DECIMAL(10,2) NOT NULL DEFAULT 0,
    status           VARCHAR(30) NOT NULL DEFAULT 'Pending',
    payment_method   VARCHAR(30) NOT NULL DEFAULT 'cod',
    payment_status   VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created   ON orders(created_at DESC);

-- ── Order Items ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vegetable_id    UUID NOT NULL REFERENCES vegetables(id) ON DELETE RESTRICT,
    vegetable_name  VARCHAR(100) NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    price           DECIMAL(10,2) NOT NULL CHECK (price > 0)
);

CREATE INDEX IF NOT EXISTS idx_oi_order_id ON order_items(order_id);

-- ── Auto-update timestamps trigger ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_vegetables_updated_at
    BEFORE UPDATE ON vegetables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
