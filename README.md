# Cashier WebApp For Sri Slamet

## Description

A web-based cashier application built for the Sri Slamet workshop.  
This system is designed to record service transactions, payments, and refund operations with a simple, accurate workflow.  
It supports two main user roles: **Admin** (full access) and **Cashier** (restricted to their own transactions).

Main features include:

-   Transaction and service management per customer.
-   Manual job entry with total price per service (no quantity or unit price).
-   Multiple payment methods: cash, down payment (DP), or credit (Kasbon).
-   Refunds per service item.
-   Centralized application settings for name, address, and VAT (PPN).

## Technologies

-   **Framework:** Laravel 12 (PHP 8.3) with Inertia
-   **Database:** MySQL / Postgres / SQLite
-   **Frontend:** Inertia React
-   **Styling:** TailwindCSS (UI Shadcn)

## Installation

1. **Clone this repository:**
    ```bash
    git clone https://github.com/dendik-creation/sri-slamet-cashier.git
    cd sri-slamet-cashier
    ```
2. **Install dependencies:**
    ```bash
    composer install
    npm install
    ```
3. **Copy and configure environment file:**

    ```bash
    cp .env.example .env
    ```

    Edit `.env` to set your database and other environment variables.

4. **Generate application key:**

    ```bash
    php artisan key:generate
    ```

5. **Run migrations:**

    ```bash
    php artisan migrate
    ```

6. **Build frontend assets:**

    ```bash
    npm run build
    ```

7. **Start the development server:**

    ```bash
    php artisan serve
    ```

8. Access the app at [http://localhost:8000](http://localhost:8000).
