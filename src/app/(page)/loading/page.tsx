'use client'

import React, {useState, useEffect} from "react";
import LoadingSpinner from "./spinner";
import getCookie from "../../function/getToken";
import { useRouter } from "next/navigation";

export default function loading() {
  const router = useRouter();

  const getToken = async() => {
    try {
      const cookie = getCookie("DrawDAccessToken");
      console.log(cookie);

      if(cookie) {
        localStorage.setItem("DrawDAccessToken", cookie);

        router.push("/");
      }
  } catch (e) {
    console.log(e);
  }
}
  
  useEffect(() => {
    getToken();
  }, [])

    return (
        <div>
            <LoadingSpinner/>
        </div>
    )
}

