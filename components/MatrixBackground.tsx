import React, { useRef, useEffect } from 'react';

const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const chars = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789";
        const charArray = chars.split('');
        const fontSize = 16;
        let drops: number[]; // Declared at the top of the scope

        const setupAndResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            const columns = Math.floor(canvas.width / fontSize);
            drops = []; 
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }
        };

        const draw = () => {
            ctx.fillStyle = 'rgba(1, 4, 9, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const style = getComputedStyle(document.body);
            ctx.fillStyle = style.getPropertyValue('--primary-glow') || '#00e87c';
            ctx.font = `${fontSize}px 'Fira Code'`;

            for (let i = 0; i < drops.length; i++) {
                const text = charArray[Math.floor(Math.random() * charArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setupAndResize();
        const intervalId = setInterval(draw, 40);

        window.addEventListener('resize', setupAndResize);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', setupAndResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 bg-[--bg-color]" />;
};

export default MatrixBackground;
