import React from "react";
import  {HashLoader}  from "react-spinners";
import styles from "../../page.module.css"

const LoadingSpinner = () => {
    return (
        <div className={`${styles.loading}`}>
            <HashLoader size = {150}/>
        </div>
    )
}

export default LoadingSpinner;