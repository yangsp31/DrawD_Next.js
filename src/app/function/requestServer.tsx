import getCookie from "./getToken";
import axios from "axios";

interface Diagram {
    title: string;
    uuid: string | string[];
    diagram: string;
    createDate: string;
}

export async function requestCheckLogin (profile : string) {
    try {
        const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/check/login`, {
            headers : {
              "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`
            },
            params : {
              profile : profile
            }
        });

        return response.data;
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response?.status === 401) {
            try {
                const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/refresh/jwt`, {
                    withCredentials : true,
                    params : {
                      profile : profile
                    }
                });
                
                const cookie = getCookie("DrawDAccessToken");
                
                if(cookie) {
                    localStorage.setItem("DrawDAccessToken", cookie);
                }
                else {
                    throw new Error("no Cookie");
                }
                
                return response.data;
            } catch(e) {
                console.error(e);
                localStorage.removeItem("DrawDAccessToken");
                
                return null;
            }
        }
        else {
            console.error(error);
            localStorage.removeItem("DrawDAccessToken");
            
            return null;
        }
    }
}

export async function requestGetPastDiagram(year : number, month : number) {
    try {
        const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/past/diagram`, {
            headers : {
                "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                "Content-Type" : "application/json"
            },
            params : {year : year, month : month, profile : "exists"}
        });

        return response.data;
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response?.status === 401) {
            try {
                const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/refresh/jwt`, {
                    withCredentials : true,
                    params : {
                        profile : "exists"
                    }
                });
                
                const cookie = getCookie("DrawDAccessToken");
                
                if(cookie) {
                    localStorage.setItem("DrawDAccessToken", cookie);
                }
                else {
                    throw new Error("no Cookie");
                }
                
                const responseRe = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/past/diagram`, {
                    headers : {
                        "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                        "Content-Type" : "application/json"
                    },
                    params : {year : year, month : month, profile : "exists"}});
                    
                    return responseRe.data;
            } catch(e) {
                console.error(e);
                localStorage.removeItem("DrawDAccessToken");
                    
                return null;
            }
        }
        else {
            console.error(error);
            localStorage.removeItem("DrawDAccessToken");
                
            return null;
        }
    }
}

export async function requestDeleteDiagram(diagramId : string | string[]) {
    try {
        const response = await axios.delete(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/delete/diagram/${diagramId}`, {
            headers : {
                "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                "Content-Type" : "application/json"
            },
            params : {profile : "exists"}
        });

        return true;
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response?.status === 401) {
            try {
                const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/refresh/jwt`, {
                    withCredentials : true,
                    params : {
                        profile : "exists"
                    }
                });
                
                const cookie = getCookie("DrawDAccessToken");
                
                if(cookie) {
                    localStorage.setItem("DrawDAccessToken", cookie);
                }
                else {
                    throw new Error("no Cookie");
                }
                
                const responseRe = await axios.delete(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/delete/diagram/${diagramId}`, {
                    headers : {
                        "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                        "Content-Type" : "application/json"
                    },
                    params : {profile : "exists"}});
                    
                    return true;
            } catch(e) {
                console.error(e);
                localStorage.removeItem("DrawDAccessToken");

                return false;
            }
        }
        else {
            console.error(error);
            localStorage.removeItem("DrawDAccessToken");
                
            return false;
        }
    }
}

export async function requestSelectedDiagram(uuid : string | string[]) {
    try {
        const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/select/diagram/${uuid}`, {
            headers : {
                "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                "Content-Type" : "application/json"
            },
            params : {
                profile : "exists"
            }
        });

        return response.data;
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response?.status === 401) {
            try {
                const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/refresh/jwt`, {
                    withCredentials : true,
                    params : {
                        profile : "exists"
                    }
                });
                
                const cookie = getCookie("DrawDAccessToken");
                
                if(cookie) {
                    localStorage.setItem("DrawDAccessToken", cookie);
                }
                else {
                    throw new Error("No cookie");
                }
                
                const responseRe = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/select/diagram/${uuid}`, {
                    headers : {
                        "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                        "Content-Type" : "application/json"
                    },
                    params : {
                        profile : "exists"
                    }
                });

                return responseRe.data;
            }
            catch (e) {
              console.log(e);
              localStorage.removeItem("DrawDAccessToken");

              return null;
            }
        }
        else {
            console.error(error);
            localStorage.removeItem("DrawDAccessToken");

            return null;
        }
    }
}

export async function requestSaveDiagram(Diagram : Diagram) {
    try {
        const response = await axios.post(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/save/Diagram`, Diagram, {
          headers : {
            "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
            "Content-Type" : "application/json"
          },
          params : {
            profile : "exists"
          }
        });

        return true;
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response?.status === 401) {
            try {
                const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/refresh/jwt`, {
                    withCredentials : true,
                    params : {
                        profile : "exists"
                    }
                });
                
                const cookie = getCookie("DrawDAccessToken");
                
                if(cookie) {
                    localStorage.setItem("DrawDAccessToken", cookie);
                }
                else {
                    throw new Error("No Cookie");
                }
                
                const responseRe = await axios.post(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/save/Diagram`, Diagram, {
                    headers : {
                        "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                        "Content-Type" : "application/json"
                    },
                    params : {
                        profile : "exists"
                    }
                });
                
                return true;
            } catch(e) {
                console.error(e);
                localStorage.removeItem("DrawDAccessToken");
                
                return false;
            }
        }
        else {
            console.error(error);
            localStorage.removeItem("DrawDAccessToken");

            return false;
        }
    }
}

export async function requestUpdateDiagram(Diagram : Diagram) {
    try {
        const response = await axios.put(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/update/Diagram`, Diagram, {
          headers : {
            "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
            "Content-Type" : "application/json"
          },
          params : {
            profile : "exists"
          }
        });

        return true;
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response?.status === 401) {
            try {
                const response = await axios.get(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/refresh/jwt`, {
                    withCredentials : true,
                    params : {
                        profile : "exists"
                    }
                });
                
                const cookie = getCookie("DrawDAccessToken");
                
                if(cookie) {
                    localStorage.setItem("DrawDAccessToken", cookie);
                }
                else {
                    throw new Error("No Cookie");
                }
                
                const responseRe = await axios.post(`https://${process.env.NEXT_PUBLIC_SERVER_DOMAIN}/update/Diagram`, Diagram, {
                    headers : {
                        "Authorization" : `Bearer ${localStorage.getItem("DrawDAccessToken")}`,
                        "Content-Type" : "application/json"
                    },
                    params : {
                        profile : "exists"
                    }
                });
                
                return true;
            } catch(e) {
                console.error(e);
                localStorage.removeItem("DrawDAccessToken");
                
                return false;
            }
        }
        else {
            console.error(error);
            localStorage.removeItem("DrawDAccessToken");

            return false;
        }
    }
}