import dbConnect from '../../../../utils/dbConnect';
import { signJWT } from '../../../../utils/jwt';
import userSchema from '../../../../utils/models/userSchema'
import { setCookies } from 'cookies-next';
import buildId from 'build-id'

dbConnect();

export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(500).json({ message: 'Soory this is post route' })
    }

    // login handler
    const { email, password } = req.body;
    const userData = await userSchema.findOne({
        email: email
    });


    if (!userData || userData.password !== password) {
        return res.status(200).send({ success: false, authorization: false, response: "Email or password is invalid" })
    };


    const refreshId = buildId(70);

    // create tokens
    const payload = { id: userData._id, refreshId: refreshId }
    const refreshToken = signJWT(payload, `${process.env.USER_SESSION_TIME}s`);

    // set latest Ids in db
    userData.refreshId = refreshId;
    await userData.save();

    // set access token in storage
    setCookies('refreshToken', refreshToken, { req, res, maxAge: process.env.USER_SESSION_TIME });

    // send user back
    return res.status(200).json({
        success: true,
        authorization: true,
        user: { username: userData.username, id: userData._id }
    });

}