-- ==============================================================
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS POSTGRESQL
-- Se ejecuta automáticamente al arrancar el contenedor por primera vez
-- a través del directorio: /docker-entrypoint-initdb.d/
-- ==============================================================

-- Creación de la tabla de elementos (items / productos)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserción de registros iniciales (Semilla / Seed Data)
INSERT INTO items (name, description, price, status) VALUES
    ('Laptop Pro 15', 'Portátil para desarrollo con 32GB RAM y 1TB SSD NVMe', 1499.99, 'available'),
    ('Mouse Inalámbrico', 'Mouse ergonómico Bluetooth con sensor de 4000 DPI', 34.50, 'available'),
    ('Teclado Mecánico RGB', 'Teclado compacto 75% con switches mecánicos táctiles', 79.90, 'available')
ON CONFLICT DO NOTHING;

