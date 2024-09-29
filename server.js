const express = require("express");
const app = express();
const port = 3000;

const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const cors = require("cors");
app.use(cors({
  origin: `http://159.89.83.104:${port}`
}));
app.use(express.json());

const mariadb = require("mariadb");
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sample",
  port: 3306,
  connectionLimit: 5,
});

const options = {
  swaggerDefinition: {
    info: {
      title: "Orders API",
      version: "1.0.0",
      description: "APIs to add and modify Orders",
    },
    host: `159.89.83.104:${port}`,
    basePath: "/",
  },
  apis: ["./server.js"],
};

const specs = swaggerJsDoc(options);

app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

// Helper function to query the database
async function queryDB(query) {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.query(query);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Retrieve all agents
 *     description: Get a list of all agents in the database.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully retrieved all agents
 *       500:
 *         description: Internal Server Error
 */
app.get("/agents", async (req, res) => {
  try {
    const agents = await queryDB("SELECT * FROM agents");
    res.status(200).json(agents);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch agents" });
  }
});

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Retrieve all customers
 *     description: Get a list of all customers in the database.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully retrieved all customers
 *       500:
 *         description: Internal Server Error
 */
app.get("/customers", async (req, res) => {
  try {
    const customers = await queryDB("SELECT * FROM customer");
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Retrieve all orders
 *     description: Get a list of all orders in the database.
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Successfully retrieved all orders
 *       500:
 *         description: Internal Server Error
 */
app.get("/orders", async (req, res) => {
  try {
    const orders = await queryDB("SELECT * FROM orders");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Retrieve an order by ID
 *     description: Fetch an order from the database by its unique Order Number (ORD_NUM).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Order Number (ORD_NUM) to retrieve.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved the order
 *       500:
 *         description: Internal Server Error
 */
app.get("/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await pool.query("SELECT * FROM orders WHERE ORD_NUM = ?", [
      id,
    ]);
    if (order.length > 0) {
      res.status(200).json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (err) {
    console.error("Error fetching order:", err.message);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Add a new order
 *     description: Add a new order to the database.
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: order
 *         description: The order data to add
 *         schema:
 *           type: object
 *           required:
 *             - ORD_NUM
 *             - ORD_AMOUNT
 *             - ADVANCE_AMOUNT
 *             - ORD_DATE
 *             - CUST_CODE
 *             - AGENT_CODE
 *             - ORD_DESCRIPTION
 *           properties:
 *             ORD_NUM:
 *               type: string
 *               example: "200134"
 *             ORD_AMOUNT:
 *               type: string
 *               example: "4200.00"
 *             ADVANCE_AMOUNT:
 *               type: string
 *               example: "1800.00"
 *             ORD_DATE:
 *               type: string
 *               format: date
 *               example: "2008-06-29"
 *             CUST_CODE:
 *               type: string
 *               example: "C00004"
 *             AGENT_CODE:
 *               type: string
 *               example: "A005"
 *             ORD_DESCRIPTION:
 *               type: string
 *               example: "SOD"
 *     responses:
 *       201:
 *         description: Order added successfully
 *       500:
 *         description: Internal Server Error
 */
app.post("/orders", async (req, res) => {
  const {
    ORD_NUM,
    ORD_AMOUNT,
    ADVANCE_AMOUNT,
    ORD_DATE,
    CUST_CODE,
    AGENT_CODE,
    ORD_DESCRIPTION,
  } = req.body;
  try {
    await pool.query(
      "INSERT INTO orders (ORD_NUM, ORD_AMOUNT, ADVANCE_AMOUNT, ORD_DATE, CUST_CODE, AGENT_CODE, ORD_DESCRIPTION) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        ORD_NUM,
        ORD_AMOUNT,
        ADVANCE_AMOUNT,
        ORD_DATE,
        CUST_CODE,
        AGENT_CODE,
        ORD_DESCRIPTION,
      ]
    );
    res.status(201).json({ message: "Order added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add order" });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update an order by ID
 *     description: Fully update an existing order in the database by Order Number (ORD_NUM).
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Order Number (ORD_NUM) to update.
 *         schema:
 *           type: integer
 *       - in: body
 *         name: order
 *         description: The updated order data
 *         schema:
 *           type: object
 *           required:
 *             - ORD_AMOUNT
 *             - ADVANCE_AMOUNT
 *             - ORD_DATE
 *             - CUST_CODE
 *             - AGENT_CODE
 *             - ORD_DESCRIPTION
 *           properties:
 *             ORD_AMOUNT:
 *               type: number
 *             ADVANCE_AMOUNT:
 *               type: number
 *             ORD_DATE:
 *               type: string
 *               format: date
 *             CUST_CODE:
 *               type: string
 *             AGENT_CODE:
 *               type: string
 *             ORD_DESCRIPTION:
 *               type: string
 *     responses:
 *       200:
 *         description: Successfully updated the order
 *       500:
 *         description: Internal Server Error
 */
app.put("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const {
    ORD_AMOUNT,
    ADVANCE_AMOUNT,
    ORD_DATE,
    CUST_CODE,
    AGENT_CODE,
    ORD_DESCRIPTION,
  } = req.body;
  try {
    await pool.query(
      "UPDATE orders SET ORD_AMOUNT = ?, ADVANCE_AMOUNT = ?, ORD_DATE = ?, CUST_CODE = ?, AGENT_CODE = ?, ORD_DESCRIPTION = ? WHERE ORD_NUM = ?",
      [
        ORD_AMOUNT,
        ADVANCE_AMOUNT,
        ORD_DATE,
        CUST_CODE,
        AGENT_CODE,
        ORD_DESCRIPTION,
        id,
      ]
    );
    res.status(200).json({ message: "Order updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     summary: Partially update an order by ID
 *     description: Update certain fields of an existing order by Order Number (ORD_NUM).
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Order Number (ORD_NUM) to update.
 *         schema:
 *           type: integer
 *       - in: body
 *         name: order
 *         description: Fields to update
 *         schema:
 *           type: object
 *           properties:
 *             ORD_AMOUNT:
 *               type: number
 *             ADVANCE_AMOUNT:
 *               type: number
 *             ORD_DATE:
 *               type: string
 *               format: date
 *             CUST_CODE:
 *               type: string
 *             AGENT_CODE:
 *               type: string
 *             ORD_DESCRIPTION:
 *               type: string
 *     responses:
 *       200:
 *         description: Order updated partially
 *       500:
 *         description: Internal Server Error
 */
app.patch("/orders/:id", async (req, res) => {
  const { id } = req.params;
  const fieldsToUpdate = Object.keys(req.body)
    .map((field) => `${field} = ?`)
    .join(", ");
  const values = Object.values(req.body);

  try {
    await pool.query(`UPDATE orders SET ${fieldsToUpdate} WHERE ORD_NUM = ?`, [
      ...values,
      id,
    ]);
    res.status(200).json({ message: "Order updated partially" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order by ID
 *     description: Remove an existing order from the database by Order Number (ORD_NUM).
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The Order Number (ORD_NUM) to delete.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       500:
 *         description: Internal Server Error
 */
app.delete("/orders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM orders WHERE ORD_NUM = ?", [id]);
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete order" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://159.89.83.104:${port}`);
});
