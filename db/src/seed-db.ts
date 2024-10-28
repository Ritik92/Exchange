// const { Client } = require('pg');

// const client = new Client({
//     user: 'your_user',
//     host: 'localhost',
//     database: 'my_database',
//     password: 'your_password',
//     port: 5432,
// });

// async function initializeDB() {
//     await client.connect();

//     // First drop the materialized views
//     await client.query(`
//         DROP MATERIALIZED VIEW IF EXISTS klines_1m;
//         DROP MATERIALIZED VIEW IF EXISTS klines_1h;
//         DROP MATERIALIZED VIEW IF EXISTS klines_1w;
//     `);

//     // Then drop and recreate the main table
//     await client.query(`
//         DROP TABLE IF EXISTS "tata_prices";
//         CREATE TABLE "tata_prices"(
//             time            TIMESTAMP WITH TIME ZONE NOT NULL,
//             price          DOUBLE PRECISION,
//             volume         DOUBLE PRECISION,
//             currency_code  VARCHAR(10)
//         );
//     `);

//     // Create the hypertable
//     await client.query(`
//         SELECT create_hypertable('tata_prices', 'time');
//     `);

//     // Recreate the materialized views
//     await client.query(`
//         CREATE MATERIALIZED VIEW klines_1m AS
//         SELECT
//             time_bucket('1 minute', time) AS bucket,
//             first(price, time) AS open,
//             max(price) AS high,
//             min(price) AS low,
//             last(price, time) AS close,
//             sum(volume) AS volume,
//             currency_code
//         FROM tata_prices
//         GROUP BY bucket, currency_code;
//     `);

//     await client.query(`
//         CREATE MATERIALIZED VIEW klines_1h AS
//         SELECT
//             time_bucket('1 hour', time) AS bucket,
//             first(price, time) AS open,
//             max(price) AS high,
//             min(price) AS low,
//             last(price, time) AS close,
//             sum(volume) AS volume,
//             currency_code
//         FROM tata_prices
//         GROUP BY bucket, currency_code;
//     `);

//     await client.query(`
//         CREATE MATERIALIZED VIEW klines_1w AS
//         SELECT
//             time_bucket('1 week', time) AS bucket,
//             first(price, time) AS open,
//             max(price) AS high,
//             min(price) AS low,
//             last(price, time) AS close,
//             sum(volume) AS volume,
//             currency_code
//         FROM tata_prices
//         GROUP BY bucket, currency_code;
//     `);

//     await client.end();
//     console.log("Database initialized successfully");
// }

// initializeDB().catch(console.error);