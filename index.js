// const express = require('express');
// const cors = require('cors');
// const port = process.env.PORT || 5000;

// const app = express();

// //Middle Ware
// app.use(cors());
// app.use(express.json());

// app.get('/', async (req, res) => {
//     res.send('Doctors Portal Server is Running');
// })
// app.listen(port, () => console.log(`Doctors Portal Running ${port}`))



const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//Middle Ware:
app.use(cors());
app.use(express.json());


// MongoDb File Connect to Cluster :
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3exxtfz.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// MongoDb CRUD Operations :
async function run() {
    try {
        const appointmentCollection = client.db("doctorsPortal").collection("appointmentOptions");
        const bookingsCollection = client.db("doctorsPortal").collection("bookings");

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            const query = {};
            const options = await appointmentCollection.find(query).toArray();
            const bookingQuery = { appointmentDate: date }
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot)
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot))
                option.slots = remainingSlots;
                // console.log(date, option.name, remainingSlots.length);
            })
            res.send(options);
        })

        // Booking Part Start : 
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment
            }

            const alreadyBookedAppointment = await bookingsCollection.find(query).toArray();
            if (alreadyBookedAppointment.length) {
                const message = `You Already Have a booking on ${booking.appointmentDate}`
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

    } finally {
        // await client.close();
    }
}
run().catch(console.log);






// Simple Setup Database :
app.get('/', async (req, res) => {
    res.send('Doctors Portal Server is Running');
})
app.listen(port, () => console.log(`Doctors Portal Running ${port}`))