const express = require('express');
const { PrismaClient } = require('@prisma/client')
const { hashSync, compareSync } = require('bcrypt')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
const app = express()

app.use(express.json())
app.get('/', (req, res) => {
    res.send('Hola mundo')
})



// get all classrooms
app.get('/classrooms', async (req, res) => {
    try {
        const classrooms = await prisma.classrooms.findMany()
        res.json(classrooms)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})
// app.post('/register', async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         const hashedPassword = hashSync(password, 10);
//         const existingUser = await prisma.users.findUnique({
//             where: { email },
//         });

//         if (existingUser) {
//             res.status(500).json({ error: "User already exists" });
//         } else {
//             const user = await prisma.users.create({
//                 data: {
//                     name,
//                     email,
//                     password: hashedPassword,
//                     role: 'USER',
//                 },
//             });
//             const createdUser = await prisma.users.findUnique({
//                 where: { id: user.id },
//             });
//             res.json(createdUser);
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.users.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const passwordMatch = compareSync(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get one classroom by id
app.get('/classrooms/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const classroom = await prisma.classrooms.findUnique({
            where: { id },
            include: { students: true }
        })
        if (classroom) {
            res.json(classroom)
        } else {
            res.status(404).json({ error: 'Classroom not found' })
        }
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// create a new classroom
app.post('/classrooms', async (req, res) => {
    try {
        const { name, capacity } = req.body
        const classroom = await prisma.classrooms.create({
            data: { name, capacity }
        })
        res.status(201).json(classroom)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// update an existing classroom by id
app.put('/classrooms/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const { name, capacity } = req.body
        const classroom = await prisma.classrooms.update({
            where: { id },
            data: { name, capacity }
        })
        res.json(classroom)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// delete an existing classroom by id
app.delete('/classrooms/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id)
        const classroom = await prisma.classrooms.delete({
            where: { id }
        })
        res.json(classroom)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

app.listen(3000, () =>
    console.log('server ready at: http://localhost:3000')
);