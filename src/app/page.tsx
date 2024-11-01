'use client'

import {useEffect, useState} from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import styles from "./page.module.css"
import getCookie from "./function/getToken";
import {requestCheckLogin} from "./function/requestServer";

export default function Home() {
  const router = useRouter();

  const [login, setLogin] = useState(true);
  const [userProfile, setUserProfile] = useState<string | null>(null);

  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/oauth2/authorization/google`;
  };

  const handleLogOut = async() => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/logout`, {
        withCredentials : true
      })

      localStorage.removeItem("DrawDAccessToken");
      localStorage.removeItem("userProfile")
      setLogin(false);

      router.replace("/");
    } catch(e) {
      console.log(e);
    }
  }

  const handleDashBoard = () => {
    router.push("/dashboard");
  }

  const checkLogin = async() => {
    const profile = localStorage.getItem("userProfile") !== null ? "exists" : "Empty";
    
    if(localStorage.getItem("DrawDAccessToken") !== null) {
      const response = await requestCheckLogin(profile);
      
      if(response !== null) {
        if(profile === "Empty") {
          localStorage.setItem("userProfile", response);
          setUserProfile(response);
        }
        
        setLogin(true);
      }
      else {
        setLogin(false);
      }
    }
    else {
      setLogin(false);
    }
  }

  useEffect(() => {
    console.log("hihihihihihihihihihi");
    checkLogin();
    setUserProfile(localStorage.getItem("userProfile"));
  }, [])

  

  return (
    <div className={`${styles.main}`}>
      <div className={`${styles.mainHeader}`}>
        <Link className={`${styles.mainHeaderImage}`} href="/">
        <img src="/DrawD.png"/>
        </Link>
        {login ? (
          <div className={`${styles.headerComponentSection}`}>
            <div className={`${styles.headerComponent}`}>
            <button className={`${styles.dashboardButton}`} onClick={handleDashBoard}>DashBoard</button>
            </div>
            <div className={`${styles.headerComponent}`}>
            <button className={`${styles.logoutButton}`} onClick={handleLogOut}>Log Out</button>
            </div>
            <div className={`${styles.headerComponent2}`}>
              {userProfile ? (
                <img className={`${styles.userProfile}`} src={userProfile}/>
              ) : (
                <span>???</span>
              )}
          </div>
          </div>
        ) : (
          <button className={`${styles.googleLoginButton}`} onClick={handleLogin}>구글 로그인</button>
        )}
      </div>
      <div className={`${styles.mainCenter}`}>
        <img className={`${styles.mainImage}`} src="/DrawD.png"/>
        <span className={`${styles.mainText}`}>Draw OLED Diagram</span>
        <div className={`${styles.mainTail}`}>
          <div className={`${styles.mainTailSection}`}>
          <div className={`${styles.mainTailComponentSection}`}>
          <img className={`${styles.mainTailImage}`} src="/DrawD.png"/>
          </div>
          <div className={`${styles.mainTailComponentSection2}`}>
            <span className={`${styles.mainTailLogo}`}>DrawD</span>
            <Link className={`${styles.serviceInfo}`} href="/refresh">서비스 정보</Link>
          </div>
          <div className={`${styles.mainTailComponentSection2}`}>
            <span className={`${styles.mainTailLogo}`}>연락처</span>
            <span className={`${styles.serviceInfo}`}>email : yang_seongp31@naver.com</span>
          </div>
          </div>
          <div className={`${styles.mainTailCopyrightSection}`}>
            <span className={`${styles.copyRight}`}>A deo vocatus rite paratus</span>
          </div>
        </div>
      </div>
    </div>
  );
}
