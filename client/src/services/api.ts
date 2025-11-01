import { JoinGameRequest, JoinGameResponse } from '../../../shared/types/index.js';

const API_BASE_URL = 'http://localhost:3000/api';

export async function joinGame(username: string): Promise<JoinGameResponse> {
    const request: JoinGameRequest = { username };

    const response = await fetch(`${API_BASE_URL}/join-game`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

     let data: any = null; 
    try {                                                   
        data = await response.json();                       
    } catch { /* ignore parse error; keep data = null */ }  

    
    if (!response.ok) {                                     
        throw new Error(                                    
            (data && data.message) ? data.message          
            : `HTTP error! status: ${response.status}`      
        );                                                  
    }                                                       

    
    return (data ?? { status: 'success', message: '' });  
}