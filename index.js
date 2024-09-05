require('dotenv').config();
const twilio = require('twilio');
const express = require('express');
const { VoiceResponse } = require('twilio').twiml;
const MessagingResponse = require("twilio").twiml.MessagingResponse;
const linkstring="https://v.personaliz.ai/?id=9b697c1a&uid=fe141702f66c760d85ab&mode=test";


const accountSid = process.env.TWILIO_ACCOUNT_SSID;
const authToken = process.env.TWILIO_AUTH_TOCKEN;
const client = twilio(accountSid, authToken);

const app = express();

app.use(express.urlencoded({ extended: false }));
app.get("/",async (req,res)=>{
  res.send("hello World !");
})
// Route to handle incoming call and provide IVR options
app.post('/twiml', (req, res) => {
  const response = new VoiceResponse();
  const gather = response.gather({
    action: '/handle_input',
    method: 'POST'
  });
  gather.say('Welcome to our service. Press 1 for your personalized interview link or press 2 if you are not interested.');
  response.redirect('/twiml'); // Redirect in case no input is received
  res.type('xml');
  res.send(response.toString());
});


// Route to handle user input
app.post('/handle_input', (req, res) => {
  const response = new VoiceResponse();
  if (req.body.Digits === '1') {
    response.say("Thank you for confirming your appointment link for your interview is sent in the sms , please check your Messages app in your mobile phone");
  } else {
    response.say('Thank you for your response. Have a good day!');
  }
  res.type('xml');
  res.send(response.toString());
});


// Route to handle call status updates
app.post('/call-status', async (req, res) => {
  console.log('Call status update:', req.body);
  
  // Check if the call ended
  if (req.body.CallStatus === 'completed') {
    try {
      const message = await client.messages.create({
        body: `The message is regarding the interview call. Your interview link is: ${linkstring}`,// the interview link provided
        from: process.env.TWILIO_NUMBER, // Your Twilio number
        to: process.env.MY_MOBILE_NUMBER  // Recipient number (change as needed)
      });
      console.log('Message SID:', message.sid);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }
  
  res.sendStatus(200);
});


// Function to make a call
async function createCall() {
  try {
    const call = await client.calls.create({
      from:process.env.TWILIO_NUMBER, // Your Twilio number
      to: process.env.MY_MOBILE_NUMBER, // Recipient number (change as needed)
      url: 'https://55d8-2405-201-c405-508e-5d03-c4ba-c79-af06.ngrok-free.app/twiml', //inorder to calling the appropriate route
      statusCallback: 'https://55d8-2405-201-c405-508e-5d03-c4ba-c79-af06.ngrok-free.app/call-status', //inorder to send message calling the appropriate route
      statusCallbackEvent: ['completed'] 
    });
    console.log('Call SID:', call.sid);
  } catch (error) {
    console.error('Error creating call:', error);
  }
}

// Start the Express server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
  createCall(); 
});
