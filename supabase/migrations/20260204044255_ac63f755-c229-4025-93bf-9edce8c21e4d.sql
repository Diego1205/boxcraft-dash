-- Add more currency options to the currency_type enum
ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'EUR';
ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'GBP';
ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'MXN';
ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'BRL';
ALTER TYPE currency_type ADD VALUE IF NOT EXISTS 'COP';