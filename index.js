const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const customersFilePath = path.join(__dirname, "customers.json");

app.use(express.json());

// Helper function to read the JSON file
const readCustomersFile = () => {
  const data = fs.readFileSync(customersFilePath);
  return JSON.parse(data);
};

// Helper function to write to the JSON file
const writeCustomersFile = (data) => {
  fs.writeFileSync(customersFilePath, JSON.stringify(data, null, 2));
};

// 1. List customers with search and pagination
app.get("/customers", (req, res) => {
  const { first_name, last_name, city, page = 1, limit = 10 } = req.query;
  let customers = readCustomersFile();

  if (first_name) {
    customers = customers.filter((c) =>
      c.first_name.toLowerCase().includes(first_name.toLowerCase())
    );
  }

  if (last_name) {
    customers = customers.filter((c) =>
      c.last_name.toLowerCase().includes(last_name.toLowerCase())
    );
  }

  if (city) {
    customers = customers.filter((c) =>
      c.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  const startIndex = (page - 1) * limit;
  const paginatedCustomers = customers.slice(startIndex, startIndex + limit);

  res.json(paginatedCustomers);
});

// 2. Get single customer by ID
app.get("/customers/:id", (req, res) => {
  const customers = readCustomersFile();
  const customer = customers.find((c) => c.id === parseInt(req.params.id));

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  res.json(customer);
});

// 3. List unique cities with customer count
app.get("/cities", (req, res) => {
  const customers = readCustomersFile();
  const cityCounts = customers.reduce((acc, customer) => {
    acc[customer.city] = (acc[customer.city] || 0) + 1;
    return acc;
  }, {});

  const uniqueCities = Object.keys(cityCounts).map((city) => ({
    city,
    customer_count: cityCounts[city],
  }));

  res.json(uniqueCities);
});

// 4. Add a customer with validations
app.post("/customers", (req, res) => {
  const { first_name, last_name, city, company } = req.body;

  if (!first_name || !last_name || !city || !company) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const customers = readCustomersFile();

  const existingCity = customers.find((c) => c.city === city);
  const existingCompany = customers.find((c) => c.company === company);

  if (!existingCity || !existingCompany) {
    return res.status(400).json({ error: "City or Company does not exist" });
  }

  const newCustomer = {
    id: customers.length + 1,
    first_name,
    last_name,
    city,
    company,
  };

  customers.push(newCustomer);
  writeCustomersFile(customers);

  res.status(201).json(newCustomer);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
