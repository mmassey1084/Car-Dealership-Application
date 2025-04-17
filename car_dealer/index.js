const express = require('express');
const path = require('path');
const db = require('./models/db');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve static HTML pages
app.get('/add-car', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/add_car.html'));
});
app.get('/register-customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/register_customer.html'));
});
app.get('/process-sale', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/process_sale.html'));
});
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html/monthly_report.html'));
});

// Handle form submissions
app.post('/add-car', (req, res) => {
    const { make, model, year, price } = req.body;
    const query = 'INSERT INTO cars (make, model, year, price) VALUES (?, ?, ?, ?)';
    db.query(query, [make, model, year, price], (error) => {
        if (error) throw error;
        res.send('Car added successfully.');
    });
});

app.post('/register-customer', (req, res) => {
    const { name, email, phone } = req.body;
    const query = 'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)';
    db.query(query, [name, email, phone], (error) => {
        if (error) throw error;
        res.send('Customer registered successfully.');
    });
});

app.post('/process-sale', (req, res) => {
    const { car_id, customer_id, total_price, monthly_payment } = req.body;
    const query = 'INSERT INTO sales (car_id, customer_id, total_price, monthly_payment_amount) VALUES (?, ?, ?, ?)';
    db.query(query, [car_id, customer_id, total_price, monthly_payment], (error) => {
        if (error) throw error;
        res.send('Sale processed successfully.');
    });
});

app.get('/monthly-report', (req, res) => {
    const query = `
        SELECT s.sale_id, s.total_price, s.monthly_payment_amount, c.name as customer_name, car.make as car_make, car.model as car_model, COUNT(p.payment_id) as payments_made
        FROM sales s
        JOIN customers c ON s.customer_id = c.customer_id
        JOIN cars car ON s.car_id = car.car_id
        LEFT JOIN payments p ON s.sale_id = p.sale_id
        GROUP BY s.sale_id`;

    db.query(query, (error, results) => {
        if (error) {
            res.status(500).send('Error fetching monthly report data');
            throw error;
        }
        const expectedRevenue = results.reduce((acc, sale) => {
            if (sale.payments_made * sale.monthly_payment_amount < sale.total_price) {
                acc += sale.monthly_payment_amount;
            }
            return acc;
        }, 0);
        res.json({ expectedRevenue, sales: results });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
