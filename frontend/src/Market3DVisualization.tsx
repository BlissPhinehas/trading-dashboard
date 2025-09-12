import React, { useRef, useEffect } from 'react';

interface StockData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
}

interface FailureConnection {
    fromSymbol: string;
    toSymbol: string;
    correlationStrength: number;
    failureType: string;
    severity: number;
    detectedAt: string;
}

// ENHANCED: Updated interface to accept new props
interface Market3DVisualizationProps {
    stockData: StockData[];
    failureConnections?: FailureConnection[];
    peRatios?: Record<string, number>;
}

const Market3DVisualization: React.FC<Market3DVisualizationProps> = ({
    stockData,
    failureConnections = [],
    peRatios = {}
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || stockData.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        let rotation = 0;
        let mouseX = 0;
        let mouseY = 0;

        // Enhanced 3D projection parameters
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 8;
        const perspective = 400;

        // Convert 3D point to 2D screen coordinates
        const project3D = (x: number, y: number, z: number) => {
            const rotatedX = x * Math.cos(rotation) - z * Math.sin(rotation);
            const rotatedZ = x * Math.sin(rotation) + z * Math.cos(rotation);

            const projectedX = (rotatedX * perspective) / (perspective + rotatedZ) + centerX;
            const projectedY = (y * perspective) / (perspective + rotatedZ) + centerY;
            const size = perspective / (perspective + rotatedZ);

            return { x: projectedX, y: projectedY, size, z: rotatedZ };
        };

        // Enhanced 3D data points with PE ratios
        const create3DPoints = () => {
            const points: Array<{
                x: number;
                y: number;
                z: number;
                color: string;
                symbol: string;
                value: number;
                change: number;
                peRatio?: number;
            }> = [];

            stockData.forEach((stock, index) => {
                const angle = (index / stockData.length) * 2 * Math.PI;
                const radius = 80;

                // Position stocks in a circle
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;

                // Height based on stock price (normalized)
                const maxPrice = Math.max(...stockData.map(s => s.price));
                const normalizedPrice = (stock.price / maxPrice) * 100;
                const y = -normalizedPrice + 20; // Negative because screen Y is inverted

                // Enhanced color coding with more nuanced performance indicators
                let color: string;
                if (stock.change >= 2.0) {
                    color = `rgba(0, 255, 128, 0.9)`; // Strong green for big gains
                } else if (stock.change >= 0) {
                    color = `rgba(0, 255, 200, 0.8)`; // Light green for gains
                } else if (stock.change >= -2.0) {
                    color = `rgba(255, 140, 0, 0.8)`; // Orange for small losses
                } else {
                    color = `rgba(255, 64, 128, 0.9)`; // Strong red for big losses
                }

                points.push({
                    x, y, z,
                    color,
                    symbol: stock.symbol,
                    value: stock.price,
                    change: stock.changePercent,
                    peRatio: peRatios[stock.symbol]
                });
            });

            return points;
        };

        // Enhanced grid with better visual depth
        const drawGrid = () => {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
            ctx.lineWidth = 1;

            // Draw grid lines with depth fading
            for (let i = -100; i <= 100; i += 20) {
                const start1 = project3D(i, 0, -100);
                const end1 = project3D(i, 0, 100);
                const start2 = project3D(-100, 0, i);
                const end2 = project3D(100, 0, i);

                // Fade lines based on depth
                const alpha1 = Math.max(0.05, Math.min(0.3, (start1.z + end1.z) / 400));
                const alpha2 = Math.max(0.05, Math.min(0.3, (start2.z + end2.z) / 400));

                if (start1.z > 0 && end1.z > 0) {
                    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha1})`;
                    ctx.beginPath();
                    ctx.moveTo(start1.x, start1.y);
                    ctx.lineTo(end1.x, end1.y);
                    ctx.stroke();
                }

                if (start2.z > 0 && end2.z > 0) {
                    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha2})`;
                    ctx.beginPath();
                    ctx.moveTo(start2.x, start2.y);
                    ctx.lineTo(end2.x, end2.y);
                    ctx.stroke();
                }
            }
        };

        // NEW: Draw failure connections as red pulsing lines
        const drawFailureConnections = (points: ReturnType<typeof create3DPoints>) => {
            if (failureConnections.length === 0) return;

            // Animate pulse effect
            const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() / 500);

            failureConnections.forEach(connection => {
                const fromPoint = points.find(p => p.symbol === connection.fromSymbol);
                const toPoint = points.find(p => p.symbol === connection.toSymbol);

                if (fromPoint && toPoint) {
                    const p1 = project3D(fromPoint.x, fromPoint.y, fromPoint.z);
                    const p2 = project3D(toPoint.x, toPoint.y, toPoint.z);

                    if (p1.z > 0 && p2.z > 0) {
                        // Failure connection styling
                        const severity = Math.min(connection.severity / 5, 1); // Normalize severity
                        const alpha = 0.4 + (severity * 0.4 * pulseIntensity);

                        ctx.strokeStyle = `rgba(255, 68, 68, ${alpha})`;
                        ctx.lineWidth = 2 + severity * 2;
                        ctx.setLineDash([5, 5]);

                        // Draw the failure connection line
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();

                        // Add failure indicator particles
                        const midX = (p1.x + p2.x) / 2;
                        const midY = (p1.y + p2.y) / 2;

                        ctx.fillStyle = `rgba(255, 68, 68, ${pulseIntensity * 0.8})`;
                        ctx.beginPath();
                        ctx.arc(midX, midY, 3 * severity, 0, Math.PI * 2);
                        ctx.fill();

                        // Reset line dash for other drawings
                        ctx.setLineDash([]);
                    }
                }
            });
        };

        // Enhanced 3D bars with PE ratio information
        const draw3DBars = (points: ReturnType<typeof create3DPoints>) => {
            // Sort points by z-depth for proper rendering
            const sortedPoints = [...points].sort((a, b) => a.z - b.z);

            sortedPoints.forEach(point => {
                const projected = project3D(point.x, point.y, point.z);
                const baseProjected = project3D(point.x, 0, point.z);

                if (projected.z > 0 && baseProjected.z > 0) {
                    // Enhanced bar dimensions
                    const barWidth = 14 * projected.size;
                    const barHeight = Math.abs(projected.y - baseProjected.y);

                    // Enhanced shadow/depth effect
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                    ctx.fillRect(
                        projected.x - barWidth / 2 + 3,
                        Math.min(projected.y, baseProjected.y) + 3,
                        barWidth,
                        barHeight
                    );

                    // Main bar with performance-based styling
                    ctx.fillStyle = point.color;
                    ctx.fillRect(
                        projected.x - barWidth / 2,
                        Math.min(projected.y, baseProjected.y),
                        barWidth,
                        barHeight
                    );

                    // Enhanced highlight with gradient
                    const gradient = ctx.createLinearGradient(
                        projected.x - barWidth / 2, projected.y,
                        projected.x + barWidth / 2, projected.y
                    );
                    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(
                        projected.x - barWidth / 2,
                        Math.min(projected.y, baseProjected.y),
                        barWidth / 3,
                        barHeight
                    );

                    // Enhanced labeling system
                    const labelY = baseProjected.y + 20 * projected.size;

                    // Stock symbol label (larger and more prominent)
                    ctx.fillStyle = '#00ffff';
                    ctx.font = `bold ${14 * projected.size}px Orbitron, monospace`;
                    ctx.textAlign = 'center';
                    ctx.fillText(point.symbol, projected.x, labelY);

                    // Price label with better formatting
                    ctx.fillStyle = point.change >= 0 ? '#00ff80' : '#ff4080';
                    ctx.font = `${11 * projected.size}px Orbitron, monospace`;
                    ctx.fillText(
                        `$${point.value < 100 ? point.value.toFixed(2) : point.value.toFixed(0)}`,
                        projected.x,
                        labelY + 18 * projected.size
                    );

                    // Change percentage with better styling
                    ctx.fillText(
                        `${point.change >= 0 ? '+' : ''}${point.change.toFixed(2)}%`,
                        projected.x,
                        labelY + 34 * projected.size
                    );

                    // NEW: Display PE ratio if available
                    if (point.peRatio && point.peRatio > 0) {
                        ctx.fillStyle = '#ffaa00';
                        ctx.font = `${9 * projected.size}px Orbitron, monospace`;
                        ctx.fillText(
                            `PE: ${point.peRatio.toFixed(1)}`,
                            projected.x,
                            labelY + 50 * projected.size
                        );
                    }
                }
            });
        };

        // Enhanced connections with sector groupings
        const drawConnections = (points: ReturnType<typeof create3DPoints>) => {
            ctx.lineWidth = 1;

            // Tech sector connections (blue)
            const techStocks = ['AAPL', 'GOOGL', 'MSFT', 'NVDA', 'AMD', 'META', 'AMZN', 'CRM', 'ORCL', 'INTC'];
            const techPoints = points.filter(p => techStocks.includes(p.symbol));

            ctx.strokeStyle = 'rgba(0, 150, 255, 0.25)';
            drawSectorConnections(techPoints, ctx, project3D);

            // Financial sector connections (green)
            const finStocks = ['JPM', 'BAC', 'V', 'MA', 'PYPL'];
            const finPoints = points.filter(p => finStocks.includes(p.symbol));

            ctx.strokeStyle = 'rgba(0, 255, 150, 0.25)';
            drawSectorConnections(finPoints, ctx, project3D);

            // Healthcare sector connections (purple)
            const healthStocks = ['JNJ', 'PFE', 'UNH', 'LLY', 'ABBV'];
            const healthPoints = points.filter(p => healthStocks.includes(p.symbol));

            ctx.strokeStyle = 'rgba(150, 100, 255, 0.25)';
            drawSectorConnections(healthPoints, ctx, project3D);
        };

        // Helper function to draw sector connections
        const drawSectorConnections = (
            sectorPoints: ReturnType<typeof create3DPoints>,
            context: CanvasRenderingContext2D,
            projectionFunc: typeof project3D
        ) => {
            for (let i = 0; i < sectorPoints.length - 1; i++) {
                const p1 = projectionFunc(sectorPoints[i].x, sectorPoints[i].y, sectorPoints[i].z);
                const p2 = projectionFunc(sectorPoints[i + 1].x, sectorPoints[i + 1].y, sectorPoints[i + 1].z);

                if (p1.z > 0 && p2.z > 0) {
                    context.beginPath();
                    context.moveTo(p1.x, p1.y);
                    context.lineTo(p2.x, p2.y);
                    context.stroke();
                }
            }
        };

        // Enhanced animation loop
        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Enhanced gradient background
            const gradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, Math.max(canvas.width, canvas.height)
            );
            gradient.addColorStop(0, 'rgba(0, 30, 60, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 15, 35, 0.9)');
            gradient.addColorStop(1, 'rgba(0, 5, 16, 0.95)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update rotation based on mouse position (smoother)
            const targetRotation = (mouseX / canvas.width - 0.5) * Math.PI;
            rotation += (targetRotation - rotation) * 0.03;

            // Draw all 3D elements in correct order
            drawGrid();

            const points = create3DPoints();

            // Draw sector connections first (background)
            drawConnections(points);

            // Draw failure connections (prominent)
            drawFailureConnections(points);

            // Draw 3D bars last (foreground)
            draw3DBars(points);

            // Enhanced title with stats
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 22px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ENHANCED 3D MARKET MATRIX', centerX, 35);

            // Add statistics display
            ctx.fillStyle = '#888';
            ctx.font = '12px Orbitron, monospace';
            ctx.fillText(
                `${stockData.length} Stocks • ${failureConnections.length} Failures • ${Object.keys(peRatios).length} PE Ratios`,
                centerX,
                55
            );

            animationRef.current = requestAnimationFrame(animate);
        };

        // Enhanced mouse interaction
        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            if (!canvas) return;
            canvas.removeEventListener('mousemove', handleMouseMove);
            if (animationRef.current !== undefined) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [stockData, failureConnections, peRatios]); // Enhanced dependencies

    return (
        <div className="market-3d-container">
            <canvas
                ref={canvasRef}
                className="market-3d-canvas"
                style={{
                    width: '100%',
                    height: '450px', // Increased height for better visibility
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '15px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    cursor: 'grab'
                }}
            />
            <div className="visualization-controls">
                <p style={{
                    color: '#888',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    marginTop: '10px',
                    lineHeight: '1.4'
                }}>
                    <strong>Interactive Controls:</strong> Move mouse to rotate •
                    <span style={{ color: '#00ff80' }}> Green</span> = Gains •
                    <span style={{ color: '#ff4080' }}> Red</span> = Losses •
                    <span style={{ color: '#ff4444' }}> Red Lines</span> = Failure Connections
                </p>
                {failureConnections.length > 0 && (
                    <p style={{
                        color: '#ff6666',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        marginTop: '5px'
                    }}>
                        ⚠️ {failureConnections.length} synchronized decline(s) detected between correlated stocks
                    </p>
                )}
            </div>
        </div>
    );
};

export default Market3DVisualization;
