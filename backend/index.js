import express from 'express'

const app = express();;


app.use('/health' , (req , res) => {
    res.send({message : "hello"})
})

app.listen(3000 , () => {
    console.log("running server ")
})