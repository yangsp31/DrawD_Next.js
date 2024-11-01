function getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    // `parts.length === 2` 조건이 만족되면, `parts.pop()`이 `undefined`일 수 있으므로, 이를 처리
    if (parts.length === 2) {
        const cookiePart = parts.pop(); // `cookiePart`는 `string | undefined`
        console.log(cookiePart);
        return cookiePart ? cookiePart.split(';').shift() ?? null : null;
    }
    return null;
}

export default getCookie;