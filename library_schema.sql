-- =====================================================
-- LIBRARY MANAGEMENT DATABASE SCHEMA DUMP
-- =====================================================

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.borrowrecords CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS comments_comment_id_seq CASCADE;
DROP SEQUENCE IF EXISTS borrowrecords_borrow_id_seq CASCADE;
DROP SEQUENCE IF EXISTS books_book_id_seq CASCADE;
DROP SEQUENCE IF EXISTS categories_category_id_seq CASCADE;
DROP SEQUENCE IF EXISTS users_user_id_seq CASCADE;

-- =====================================================
-- Create Sequences
-- =====================================================

CREATE SEQUENCE users_user_id_seq;
CREATE SEQUENCE categories_category_id_seq;
CREATE SEQUENCE books_book_id_seq;
CREATE SEQUENCE borrowrecords_borrow_id_seq;
CREATE SEQUENCE comments_comment_id_seq;

-- =====================================================
-- USERS TABLE
-- =====================================================

CREATE TABLE public.users (
    user_id INTEGER NOT NULL DEFAULT nextval('users_user_id_seq'::regclass),
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_token VARCHAR(100),
    verification_expires TIMESTAMPTZ,
    reset_token VARCHAR(100),
    reset_expires TIMESTAMPTZ,

    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_check
        CHECK (role::text = ANY (ARRAY['Admin','Member']::text[]))
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================

CREATE TABLE public.categories (
    category_id INTEGER NOT NULL DEFAULT nextval('categories_category_id_seq'::regclass),
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT categories_pkey PRIMARY KEY (category_id),
    CONSTRAINT categories_name_key UNIQUE (name)
);

-- =====================================================
-- BOOKS TABLE
-- =====================================================

CREATE TABLE public.books (
    book_id INTEGER NOT NULL DEFAULT nextval('books_book_id_seq'::regclass),
    title VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    category_id INTEGER,
    publication_year INTEGER,
    stock_quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT books_pkey PRIMARY KEY (book_id),

    CONSTRAINT books_publication_year_check
        CHECK (
            publication_year > 0
            AND publication_year::double precision <=
                date_part('year', CURRENT_DATE)
        ),

    CONSTRAINT books_stock_quantity_check
        CHECK (stock_quantity >= 0),

    CONSTRAINT books_category_id_fkey
        FOREIGN KEY (category_id)
        REFERENCES public.categories(category_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_books_title_author
ON public.books (title, author);

-- =====================================================
-- BORROW RECORDS TABLE
-- =====================================================

CREATE TABLE public.borrowrecords (
    borrow_id INTEGER NOT NULL DEFAULT nextval('borrowrecords_borrow_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrow_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ NOT NULL,
    return_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT borrowrecords_pkey PRIMARY KEY (borrow_id),

    CONSTRAINT borrowrecords_status_check
        CHECK (status::text = ANY (ARRAY['Borrowed','Overdue','Returned']::text[])),

    CONSTRAINT borrowrecords_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT borrowrecords_book_id_fkey
        FOREIGN KEY (book_id)
        REFERENCES public.books(book_id)
        ON DELETE CASCADE
);

CREATE INDEX idx_borrowrecords_user_id
ON public.borrowrecords (user_id);

CREATE INDEX idx_borrowrecords_book_id
ON public.borrowrecords (book_id);

CREATE INDEX idx_borrowrecords_status
ON public.borrowrecords (status);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================

CREATE TABLE public.comments (
    comment_id INTEGER NOT NULL DEFAULT nextval('comments_comment_id_seq'::regclass),
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    rating INTEGER,
    comment VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT comments_pkey PRIMARY KEY (comment_id),

    CONSTRAINT comments_rating_check
        CHECK (rating >= 1 AND rating <= 5),

    CONSTRAINT comments_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT comments_book_id_fkey
        FOREIGN KEY (book_id)
        REFERENCES public.books(book_id)
        ON DELETE CASCADE
);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
