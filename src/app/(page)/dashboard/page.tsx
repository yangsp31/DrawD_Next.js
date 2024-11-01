'use client'

import {useState, useEffect} from "react"
import Link from "next/link"
import styles from "../../page.module.css"
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import getCookie from "../../function/getToken";
import { requestDeleteDiagram, requestGetPastDiagram } from "../../function/requestServer";

interface PastDiagram {
    title: string;
    createDate: string;
    diagramMetaId_DiagramId: string;
}

interface Diagram {
    uuid : string;
    diagram: string;
    createDate: string;
}


export default function dashboard() {
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth() + 1;
    const yearArray = Array.from({length : 11}, (_, index) => nowYear - index);
    const monthArray = Array.from({length : 12}, (_, index) => index + 1);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const [userProfile, setUserProfile] = useState<string | null>(null);
    const [login, setLogin] = useState(true);

    const [year, setYear] = useState(nowYear);
    const [month, setMonth] = useState(nowMonth);

    const [pastDiagram, setPastDiagram] = useState<PastDiagram[]>([]);
    const [temporaryDiagram, setTemporaryDiagram] = useState<Diagram[]>([]);

    const router = useRouter();

    const handleNewButton = () => {
        const uuid = uuidv4();
        router.push(`/newD/${uuid}?new=true`);
    }

    const getPastDiagram = async() => {
        const response = await requestGetPastDiagram(year, month);
        const data : PastDiagram[] | null = response;
        
        if(data !== null) {
            const sortedDate = data.sort((a, b) => {
                return new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
            }).map(item => {
                const updatedCreateDate = item.createDate.endsWith('Z') ? item.createDate : `${item.createDate}Z`;
                return {...item, createDate: updatedCreateDate};
            });
            
            setPastDiagram(sortedDate);
        }
        else {
            alert('Error, try logging in again or contact us');
            router.replace("/");
        }
    };

    const getTemporaryDiagram = () => {
        const keys = Object.keys(localStorage).filter(key => key.startsWith("DrawDTS-"));

        const data : Diagram[] = keys.map(key => {
            const diagramData = localStorage.getItem(key);
            if(diagramData) {
                return JSON.parse(diagramData) as Diagram;
            }

            return null;
        }).filter(item => item !== null) as Diagram[];

        if(data !== null) {
            const sortedDate = data.sort((a, b) => {
                return new Date(b.createDate).getTime() - new Date(a.createDate).getTime();
            }).map(item => {
                const updatedCreateDate = item.createDate.endsWith('Z') ? item.createDate : `${item.createDate}Z`;
                return {...item, createDate: updatedCreateDate};
            });
            
            setTemporaryDiagram(sortedDate);

            console.log(sortedDate)
        }
    }

    useEffect(() => {
        setUserProfile(localStorage.getItem("userProfile"));
        getPastDiagram();
        getTemporaryDiagram();
      }, []);

    const handleSearchButton = async() => {
        await getPastDiagram();
    }

    const handleEditButton = (diagramId : string | string[]) => {
        router.push(`/newD/${diagramId}?new=false`);
    }

    const handleDeleteButton = async(diagramId : string | string[]) => {
        const confirmed = confirm("Are you sure you want to delete?");

        if(confirmed) {
            if(await requestDeleteDiagram(diagramId)) {
                setPastDiagram(prevDiagrams => prevDiagrams.filter(diagram => diagram.diagramMetaId_DiagramId !== diagramId));
            }
            else {
                alert("Can't delete, please log in again or contact us");
                getPastDiagram();
            }
        }
    }

    const handleTemporaryDeleteButton = (diagramId : string) => {
        const confirmed = confirm("Are you sure you want to delete?");

        if(confirmed) {
            localStorage.removeItem(diagramId);
            setTemporaryDiagram(prevDiagrams => prevDiagrams.filter(diagram => diagram.uuid !== diagramId));
        }
    }

    return (
        <div className={`${styles.main}`}>
            <div className={`${styles.mainHeader}`}>
                <Link className={`${styles.mainHeaderImage}`} href="/">
                <img src="/DrawD.png"/>
                </Link>
                <div className={`${styles.headerComponentSection}`}>
                    <div className={`${styles.headerComponent}`}>
                        <button className={`${styles.logoutButton}`} onClick={handleNewButton}>+ New</button>
                    </div>
                    <div className={`${styles.headerComponent}`}>
                        <button className={`${styles.logoutButton}`}>Log Out</button>
                    </div>
                    <div className={`${styles.headerComponent2}`}>
                        {userProfile ? (
                            <img className={`${styles.userProfile}`} src={userProfile}/>
                        ) : (
                        <span>???</span>
                        )}
                    </div>
                </div>
            </div>
            <div className={`${styles.dashboardSetDateSection}`}>
                <select value={year} onChange={(e) => {setYear(parseInt(e.target.value))}} className="w-40 px-2 py-3 mr-3 border rounded" aria-label="Year">
                    {yearArray.map(year => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
                <span className="font-bold text-white mr-20" style={{ fontSize: '35px'}}>Year</span>
                <select value={month} onChange={(e) => {setMonth(parseInt(e.target.value))}} className="w-40 px-2 py-3 mr-3 border rounded" aria-label="Month">
                    {monthArray.map(month => (
                        <option key={month} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
                <span className="font-bold text-white mr-20" style={{ fontSize: '35px'}}>Month</span>
                <button 
                  type="button"
                  className="w-40 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600" 
                  aria-label="Save Structure" 
                  style={{ fontSize: '20px'}} 
                  onClick={handleSearchButton}
                >
                    Search
                </button>
            </div>
            <div className={`${styles.dashboardCenter}`}>
            {temporaryDiagram.length > 0 &&
          temporaryDiagram.map((diagram, index) => (
            <div
              key={index}
              className="border border-gray-300 rounded-lg p-4 mb-10 grid grid-cols-[1fr,auto] gap-4 items-center h-32"
              style={{ width: '60%' }}
            >
              <div className="flex flex-col justify-between h-full">
                <span className="font-bold text-white" style={{ fontSize: '35px' }}>
                  Temporary Diagram{index + 1}
                </span>
                <span className="font-bold text-gray-300" style={{ fontSize: '20px' }}>
                  {new Date(diagram.createDate).toLocaleString(undefined, {
                    timeZone: userTimeZone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>
              <div className="flex flex-col justify-center space-y-2">
                <button
                  className="p-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                  aria-label="Edit diagram"
                  onClick={() => handleEditButton(diagram.uuid)}
                >
                  <Pencil className="text-white" size={24} />
                </button>
                <button
                  className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                  aria-label="Delete diagram"
                  onClick={() => handleTemporaryDeleteButton(diagram.uuid)}
                >
                  <Trash2 className="text-white" size={24} />
                </button>
              </div>
              {index === temporaryDiagram.length - 1 && (
                <div className="col-span-2 border-t-4 border-b-4 border-white mx-auto" style={{ width: '100%', marginTop:'2%', borderTopStyle: 'dashed', borderBottomStyle: 'dashed',}}></div>)}
                </div>
              ))
              }
                {pastDiagram.map((diagram, index) => (
                    <div key={index} className="border border-gray-300 rounded-lg p-4 mb-10 grid grid-cols-[1fr,auto] gap-4 items-center h-32" style={{ width: '60%' }}>
                        <div className="flex flex-col justify-between h-full">
                        <span className="font-bold text-white" style={{ fontSize: '35px'}}>{diagram.title}</span>
                        <span className="font-bold text-gray-300" style={{ fontSize: '20px'}}>{new Date(diagram.createDate).toLocaleString(undefined,{
                            timeZone : userTimeZone,
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false
                        })}
                        </span>
                        </div>
                        <div className="flex flex-col justify-center space-y-2">
                            <button 
                                className="p-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                aria-label="Edit diagram"
                                onClick={() => handleEditButton(diagram.diagramMetaId_DiagramId)}
                            >
                                <Pencil className="text-white" size={24} />
                            </button>
                            <button 
                                className="p-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                                aria-label="Delete diagram"
                                onClick={() => handleDeleteButton(diagram.diagramMetaId_DiagramId)}
                            >
                                <Trash2 className="text-white" size={24} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}