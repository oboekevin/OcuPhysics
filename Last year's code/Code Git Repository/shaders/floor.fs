uniform float squareSize;
varying vec4 worldCoord;

void main() {
    float ox = mod(worldCoord.x, squareSize) - squareSize / 2.0;
    float oz = mod(worldCoord.z, squareSize) - squareSize / 2.0;
    if (sign(ox) == sign(oz)) {
        gl_FragColor = vec4(0.45, 0.45, 0.45, 1);
    } else {
        gl_FragColor = vec4(0.5, 0.5, 0.5, 1);
    }
}