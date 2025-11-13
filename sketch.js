// Bubble Bubble - Enhanced Interactive Motion Graphics
// 더 재미있고 화려한 인터랙티브 모션 그래픽

let bubbles = [];
let particles = [];
let stars = [];
let powerups = [];
let blackHoles = [];
let waveOffset = 0;
let hueOffset = 0;

// 게임 상태
let mode = 'normal'; // normal, fireworks, gravity, repel, chaos, blackhole
let score = 0;
let combo = 0;
let showTrail = false;
let magneticMode = false;
let rainbowMode = false;

// 설정
const MODES = {
    normal: { name: '🫧 노말', color: [180, 70, 90] },
    fireworks: { name: '🎆 폭죽', color: [0, 100, 100] },
    gravity: { name: '🌍 중력', color: [270, 80, 70] },
    repel: { name: '⚡ 반발', color: [60, 100, 100] },
    chaos: { name: '🌀 카오스', color: [300, 100, 90] },
    blackhole: { name: '🕳️ 블랙홀', color: [280, 50, 30] },
    rainbow: { name: '🌈 레인보우', color: [150, 100, 100] }
};

class Bubble {
    constructor(x, y, size = null) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-2, 2), random(-2, 2));
        this.acc = createVector(0, 0);
        this.size = size || random(20, 80);
        this.hue = random(360);
        this.alpha = 200;
        this.life = 255;
        this.rotation = random(TWO_PI);
        this.rotationSpeed = random(-0.05, 0.05);
        this.pulseOffset = random(TWO_PI);
    }

    follow(target) {
        let force = p5.Vector.sub(target, this.pos);
        let distance = force.mag();
        force.normalize();

        if (mode === 'repel') {
            force.mult(-0.3);
        } else if (mode === 'gravity') {
            force.mult(0.2);
        } else if (mode === 'blackhole') {
            let strength = map(distance, 0, 200, 0.5, 0.05);
            force.mult(strength);
        } else {
            force.mult(0.1);
        }

        this.acc.add(force);
    }

    applyGravity() {
        if (mode === 'gravity') {
            this.acc.add(createVector(0, 0.2));
        }
    }

    update() {
        this.vel.add(this.acc);

        if (mode === 'chaos') {
            this.vel.limit(10);
        } else if (mode === 'fireworks') {
            this.vel.limit(8);
        } else {
            this.vel.limit(5);
        }

        this.pos.add(this.vel);
        this.acc.mult(0);

        // 화면 경계 처리
        if (mode === 'gravity') {
            if (this.pos.x < 0 || this.pos.x > width) {
                this.vel.x *= -0.8;
                this.pos.x = constrain(this.pos.x, 0, width);
            }
            if (this.pos.y > height) {
                this.vel.y *= -0.8;
                this.pos.y = height;
            }
        } else {
            if (this.pos.x < 0 || this.pos.x > width) {
                this.vel.x *= -1;
            }
            if (this.pos.y < 0 || this.pos.y > height) {
                this.vel.y *= -1;
            }
            this.pos.x = constrain(this.pos.x, 0, width);
            this.pos.y = constrain(this.pos.y, 0, height);
        }

        // 회전 및 색상 변화
        this.rotation += this.rotationSpeed;

        if (rainbowMode || mode === 'rainbow') {
            this.hue = (this.hue + 2) % 360;
        } else {
            this.hue = (this.hue + 0.5) % 360;
        }
    }

    display() {
        push();
        colorMode(HSB, 360, 100, 100, 255);

        let pulse = sin(frameCount * 0.05 + this.pulseOffset) * 5;

        // 외부 글로우
        noStroke();
        for (let i = 3; i > 0; i--) {
            fill(this.hue, 70, 100, 20 * i);
            circle(this.pos.x, this.pos.y, this.size * 1.2 + pulse + i * 10);
        }

        // 메인 버블
        fill(this.hue, 80, 90, this.alpha);
        circle(this.pos.x, this.pos.y, this.size + pulse);

        // 하이라이트
        fill(this.hue, 40, 100, 180);
        circle(this.pos.x - this.size * 0.2, this.pos.y - this.size * 0.2, this.size * 0.3);

        // 반짝이는 별 효과
        if (mode === 'fireworks' || mode === 'rainbow') {
            translate(this.pos.x, this.pos.y);
            rotate(this.rotation);
            for (let i = 0; i < 4; i++) {
                rotate(HALF_PI);
                fill(this.hue + 30, 100, 100, 150);
                triangle(-3, -this.size * 0.4, 3, -this.size * 0.4, 0, -this.size * 0.5);
            }
        }

        pop();
    }
}

class Particle {
    constructor(x, y, hue, vx = null, vy = null) {
        this.pos = createVector(x, y);

        if (vx !== null && vy !== null) {
            this.vel = createVector(vx, vy);
        } else {
            this.vel = p5.Vector.random2D().mult(random(2, 10));
        }

        this.acc = createVector(0, mode === 'fireworks' ? -0.1 : 0.1);
        this.hue = hue;
        this.life = 255;
        this.size = random(2, 8);
        this.trail = [];
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.life -= mode === 'fireworks' ? 3 : 5;

        if (showTrail && frameCount % 2 === 0) {
            this.trail.push({
                x: this.pos.x,
                y: this.pos.y,
                life: 100
            });
        }

        // 트레일 업데이트
        for (let i = this.trail.length - 1; i >= 0; i--) {
            this.trail[i].life -= 10;
            if (this.trail[i].life <= 0) {
                this.trail.splice(i, 1);
            }
        }
    }

    display() {
        push();
        colorMode(HSB, 360, 100, 100, 255);

        // 트레일 그리기
        for (let i = 0; i < this.trail.length; i++) {
            let t = this.trail[i];
            noStroke();
            fill(this.hue, 90, 100, t.life);
            circle(t.x, t.y, this.size * 0.5);
        }

        // 메인 파티클
        noStroke();
        fill(this.hue, 90, 100, this.life);
        circle(this.pos.x, this.pos.y, this.size);

        // 반짝임
        fill(this.hue, 50, 100, this.life * 0.7);
        circle(this.pos.x, this.pos.y, this.size * 0.5);

        pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

class Star {
    constructor() {
        this.x = random(width);
        this.y = random(height);
        this.size = random(1, 3);
        this.brightness = random(100, 255);
        this.twinkleSpeed = random(0.02, 0.05);
    }

    update() {
        this.brightness = 150 + sin(frameCount * this.twinkleSpeed) * 100;
    }

    display() {
        push();
        noStroke();
        fill(255, this.brightness);
        circle(this.x, this.y, this.size);
        pop();
    }
}

class PowerUp {
    constructor(x, y, type) {
        this.pos = createVector(x, y);
        this.type = type; // 'magnet', 'rainbow', 'explode', 'multiply'
        this.size = 30;
        this.hue = 0;
        this.collected = false;
        this.life = 300;

        switch(type) {
            case 'magnet': this.hue = 200; this.emoji = '🧲'; break;
            case 'rainbow': this.hue = 150; this.emoji = '🌈'; break;
            case 'explode': this.hue = 0; this.emoji = '💣'; break;
            case 'multiply': this.hue = 280; this.emoji = '✨'; break;
        }
    }

    update() {
        this.life--;
        this.pos.y += sin(frameCount * 0.05) * 0.5;
    }

    display() {
        push();
        colorMode(HSB, 360, 100, 100, 255);

        // 글로우
        noStroke();
        fill(this.hue, 70, 100, 30);
        circle(this.pos.x, this.pos.y, this.size * 2);

        // 메인
        fill(this.hue, 90, 90, 200);
        circle(this.pos.x, this.pos.y, this.size);

        // 이모지 (텍스트로 표시)
        textAlign(CENTER, CENTER);
        textSize(20);
        text(this.emoji, this.pos.x, this.pos.y);

        pop();
    }

    checkCollision(bubble) {
        let d = p5.Vector.dist(this.pos, bubble.pos);
        return d < this.size + bubble.size / 2;
    }

    isDead() {
        return this.life <= 0 || this.collected;
    }
}

class BlackHole {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.size = 50;
        this.rotation = 0;
        this.life = 200;
    }

    update() {
        this.rotation += 0.1;
        this.life--;
        this.size += 0.5;
    }

    pull(bubble) {
        let force = p5.Vector.sub(this.pos, bubble.pos);
        let distance = force.mag();

        if (distance < 300) {
            force.normalize();
            let strength = map(distance, 0, 300, 0.8, 0.05);
            force.mult(strength);
            bubble.acc.add(force);

            if (distance < this.size) {
                return true; // 삼켜짐
            }
        }
        return false;
    }

    display() {
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.rotation);

        colorMode(HSB, 360, 100, 100, 255);

        // 회전하는 소용돌이
        for (let i = 0; i < 8; i++) {
            let angle = (TWO_PI / 8) * i + this.rotation;
            let r = this.size;

            noFill();
            stroke(280, 80, 50, 150);
            strokeWeight(3);

            for (let j = 0; j < 5; j++) {
                let offset = j * 20;
                beginShape();
                for (let a = 0; a < PI; a += 0.1) {
                    let x = cos(angle + a) * (r + offset);
                    let y = sin(angle + a) * (r + offset);
                    vertex(x, y);
                }
                endShape();
            }
        }

        // 중심부
        noStroke();
        fill(0, 255);
        circle(0, 0, this.size);

        fill(280, 100, 30, 200);
        circle(0, 0, this.size * 0.8);

        pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // 배경 별들 생성
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }

    // 초기 버블 생성
    for (let i = 0; i < 30; i++) {
        bubbles.push(new Bubble(random(width), random(height)));
    }
}

function draw() {
    // 배경
    background(0, 25);

    // 별 그리기
    for (let star of stars) {
        star.update();
        star.display();
    }

    // 웨이브 배경 효과
    drawWaveBackground();

    // 마우스 위치
    let mouse = createVector(mouseX, mouseY);

    // 블랙홀 업데이트
    for (let i = blackHoles.length - 1; i >= 0; i--) {
        let bh = blackHoles[i];
        bh.update();
        bh.display();

        if (bh.isDead()) {
            blackHoles.splice(i, 1);
        }
    }

    // 파워업 업데이트
    for (let i = powerups.length - 1; i >= 0; i--) {
        let pu = powerups[i];
        pu.update();
        pu.display();

        if (pu.isDead()) {
            powerups.splice(i, 1);
        }
    }

    // 버블 업데이트 및 그리기
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let bubble = bubbles[i];

        // 마우스 인터랙션
        let d = p5.Vector.dist(mouse, bubble.pos);
        if (d < 200 || magneticMode) {
            bubble.follow(mouse);
        }

        // 블랙홀에 끌리기
        for (let bh of blackHoles) {
            if (bh.pull(bubble)) {
                bubbles.splice(i, 1);
                createExplosion(bubble.pos.x, bubble.pos.y, bubble.hue, 20);
                score += 10;
                break;
            }
        }

        // 중력 적용
        bubble.applyGravity();

        // 카오스 모드
        if (mode === 'chaos' && frameCount % 30 === 0) {
            bubble.acc.add(p5.Vector.random2D().mult(2));
        }

        // 다른 버블들과 상호작용
        for (let j = 0; j < bubbles.length; j++) {
            if (i !== j) {
                let other = bubbles[j];
                let distance = p5.Vector.dist(bubble.pos, other.pos);

                // 충돌
                if (distance < (bubble.size + other.size) / 2) {
                    let force = p5.Vector.sub(bubble.pos, other.pos);
                    force.normalize();
                    force.mult(mode === 'chaos' ? 1 : 0.5);
                    bubble.acc.add(force);
                }

                // 연결선
                if (distance < 150) {
                    push();
                    colorMode(HSB, 360, 100, 100, 255);
                    let alpha = map(distance, 0, 150, 80, 0);
                    stroke((bubble.hue + other.hue) / 2, 70, 80, alpha);
                    strokeWeight(mode === 'rainbow' ? 3 : 2);
                    line(bubble.pos.x, bubble.pos.y, other.pos.x, other.pos.y);
                    pop();
                }
            }
        }

        // 파워업 체크
        for (let pu of powerups) {
            if (!pu.collected && pu.checkCollision(bubble)) {
                collectPowerUp(pu);
                pu.collected = true;
            }
        }

        bubble.update();
        bubble.display();
    }

    // 파티클 업데이트
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();

        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // UI 그리기
    drawUI();

    // 글로벌 효과 업데이트
    waveOffset += mode === 'chaos' ? 0.05 : 0.02;
    hueOffset = (hueOffset + (mode === 'rainbow' ? 2 : 0.3)) % 360;

    // 랜덤 파워업 생성
    if (frameCount % 300 === 0 && powerups.length < 3) {
        let types = ['magnet', 'rainbow', 'explode', 'multiply'];
        powerups.push(new PowerUp(random(width), random(height), random(types)));
    }
}

function drawWaveBackground() {
    push();
    colorMode(HSB, 360, 100, 100, 255);
    noFill();

    let numWaves = mode === 'chaos' ? 10 : 5;

    for (let i = 0; i < numWaves; i++) {
        let currentHue = (hueOffset + i * 30) % 360;
        stroke(currentHue, 60, 50, 30);
        strokeWeight(mode === 'rainbow' ? 3 : 2);

        beginShape();
        for (let x = 0; x <= width; x += 10) {
            let y = height / 2 + sin(x * 0.01 + waveOffset + i * 0.5) * 50 * (i + 1);
            vertex(x, y);
        }
        endShape();
    }
    pop();
}

function drawUI() {
    push();
    colorMode(HSB, 360, 100, 100, 255);

    // 모드 표시
    let modeColor = MODES[mode].color;
    fill(modeColor[0], modeColor[1], modeColor[2], 200);
    noStroke();
    rect(10, 50, 200, 40, 10);

    fill(0);
    textAlign(LEFT, CENTER);
    textSize(20);
    text(MODES[mode].name, 20, 70);

    // 점수
    fill(60, 100, 100, 200);
    rect(10, 100, 200, 40, 10);
    fill(0);
    text(`점수: ${score}`, 20, 120);

    // 콤보
    if (combo > 1) {
        fill(0, 100, 100, 200);
        rect(10, 150, 200, 40, 10);
        fill(255);
        text(`콤보 x${combo}! 🔥`, 20, 170);
    }

    // 상태 표시
    let statusY = combo > 1 ? 200 : 150;
    if (magneticMode) {
        fill(200, 100, 100, 200);
        rect(10, statusY, 200, 30, 10);
        fill(255);
        textSize(16);
        text('🧲 자석 모드', 20, statusY + 15);
        statusY += 40;
    }

    if (rainbowMode) {
        fill(150, 100, 100, 200);
        rect(10, statusY, 200, 30, 10);
        fill(255);
        text('🌈 레인보우 모드', 20, statusY + 15);
    }

    pop();
}

function createExplosion(x, y, hue, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, hue + random(-30, 30)));
    }
}

function createFirework(x, y) {
    let hue = random(360);
    for (let i = 0; i < 100; i++) {
        let angle = random(TWO_PI);
        let speed = random(5, 15);
        let vx = cos(angle) * speed;
        let vy = sin(angle) * speed;
        particles.push(new Particle(x, y, hue + random(-20, 20), vx, vy));
    }
}

function collectPowerUp(pu) {
    score += 50;
    combo++;

    createExplosion(pu.pos.x, pu.pos.y, pu.hue, 30);

    switch(pu.type) {
        case 'magnet':
            magneticMode = true;
            setTimeout(() => { magneticMode = false; }, 5000);
            break;
        case 'rainbow':
            rainbowMode = true;
            setTimeout(() => { rainbowMode = false; }, 5000);
            break;
        case 'explode':
            for (let bubble of bubbles) {
                createExplosion(bubble.pos.x, bubble.pos.y, bubble.hue, 10);
            }
            break;
        case 'multiply':
            let newBubbles = [];
            for (let bubble of bubbles) {
                newBubbles.push(new Bubble(bubble.pos.x + 20, bubble.pos.y, bubble.size * 0.8));
            }
            bubbles.push(...newBubbles);
            break;
    }
}

function mousePressed() {
    if (mode === 'fireworks') {
        createFirework(mouseX, mouseY);
        score += 5;
    } else if (mode === 'blackhole') {
        blackHoles.push(new BlackHole(mouseX, mouseY));
        score += 10;
    } else {
        createExplosion(mouseX, mouseY, random(360), 50);
        bubbles.push(new Bubble(mouseX, mouseY));

        if (bubbles.length > 80) {
            bubbles.shift();
        }

        score += 1;
    }

    combo++;
    setTimeout(() => { combo = 0; }, 2000);
}

function mouseDragged() {
    if (frameCount % 2 === 0) {
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(mouseX, mouseY, hueOffset + random(-30, 30)));
        }
    }
}

function keyPressed() {
    // 모드 전환
    if (key === '1') mode = 'normal';
    if (key === '2') mode = 'fireworks';
    if (key === '3') mode = 'gravity';
    if (key === '4') mode = 'repel';
    if (key === '5') mode = 'chaos';
    if (key === '6') mode = 'blackhole';
    if (key === '7') mode = 'rainbow';

    // 특수 기능
    if (key === 't' || key === 'T') {
        showTrail = !showTrail;
    }

    if (key === 'r' || key === 'R') {
        bubbles = [];
        particles = [];
        blackHoles = [];
        powerups = [];
        score = 0;
        combo = 0;
        mode = 'normal';

        for (let i = 0; i < 30; i++) {
            bubbles.push(new Bubble(random(width), random(height)));
        }
    }

    if (key === 'e' || key === 'E') {
        // 모든 버블 폭발
        for (let bubble of bubbles) {
            createExplosion(bubble.pos.x, bubble.pos.y, bubble.hue, 20);
        }
        bubbles = [];
        score += 100;
    }

    if (key === 'm' || key === 'M') {
        // 더 많은 버블 생성
        for (let i = 0; i < 20; i++) {
            bubbles.push(new Bubble(random(width), random(height)));
        }
    }

    if (key === ' ') {
        // 스페이스바: 메가 폭발
        createFirework(width/2, height/2);
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                createFirework(random(width), random(height));
            }, i * 100);
        }
        score += 50;
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
