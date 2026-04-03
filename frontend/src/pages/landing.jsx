import React from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'

function randomMeetingCode() {
    return Math.random().toString(36).substring(2, 8);
}

export default function LandingPage() {


    const router = useNavigate();

    const handleJoinAsGuest = () => {
        const code = randomMeetingCode();
        router(`/${code}`);
    };

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>LiveLink Meeting App</h2>
                </div>
                <div className='navlist'>
                    <p onClick={handleJoinAsGuest}>Join as Guest</p>
                    <p onClick={() => {
                        router("/auth")

                    }}>Register</p>
                    <div onClick={() => {
                        router("/auth")

                    }} role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>


            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> <span style={{ color: "#000" }}>with your loved Ones</span></h1>

                    <p style={{ color: "#000" }}>LiveLink Meeting App</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>

                    <img src="/mobile.png" alt="" />

                </div>
            </div>



        </div>
    )
}
