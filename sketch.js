// Bubble Bubble - Interactive Motion Graphics
// 버블들이 춤추는 인터랙티브 모션 그래픽

let bubbles = [];
let particles = [];
let waveOffset = 0;
let hueOffset = 0;

class Bubble {
    constructor(x, y) {
        this.pos = createVector(x, y);
        this.vel = createVector(random(-1, 1), random(-1, 1));
        this.acc = createVector(0, 0);
        this.size = random(20, 80);
        this.hue = random(360);
        this.alpha = 200;
        this.life = 255;
    }

    follow(target) {
        let force = p5.Vector.sub(target, this.pos);
        force.setMag(0.1);
        this.acc.add(force);
    }

    update() {
        this.vel.add(this.acc);
        this.vel.limit(5);
        this.pos.add(this.vel);
        this.acc.mult(0);

        // 화면 경계에서 튕기기
        if (this.pos.x < 0 || this.pos.x > width) {
            this.vel.x *= -1;
        }
        if (this.pos.y < 0 || this.pos.y > height) {
            this.vel.y *= -1;
        }

        // 경계 안에 유지
        this.pos.x = constrain(this.pos.x, 0, width);
        this.pos.y = constrain(this.pos.y, 0, height);

        // 색상 변화
        this.hue = (this.hue + 0.5) % 360;
    }

    display() {
        push();
        colorMode(HSB, 360, 100, 100, 255);

        // 외부 글로우
        noStroke();
        fill(this.hue, 70, 100, 30);
        circle(this.pos.x, this.pos.y, this.size * 1.5);

        // 메인 버블
        fill(this.hue, 80, 90, this.alpha);
        circle(this.pos.x, this.pos.y, this.size);

        // 하이라이트
        fill(this.hue, 40, 100, 150);
        circle(this.pos.x - this.size * 0.2, this.pos.y - this.size * 0.2, this.size * 0.3);

        pop();
    }

    edges() {
        return this.pos.x < 0 || this.pos.x > width ||
               this.pos.y < 0 || this.pos.y > height;
    }
}

class Particle {
    constructor(x, y, hue) {
        this.pos = createVector(x, y);
        this.vel = p5.Vector.random2D().mult(random(2, 8));
        this.acc = createVector(0, 0.1);
        this.hue = hue;
        this.life = 255;
        this.size = random(3, 8);
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.life -= 5;
    }

    display() {
        push();
        colorMode(HSB, 360, 100, 100, 255);
        noStroke();
        fill(this.hue, 90, 100, this.life);
        circle(this.pos.x, this.pos.y, this.size);
        pop();
    }

    isDead() {
        return this.life <= 0;
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // 초기 버블 생성
    for (let i = 0; i < 30; i++) {
        bubbles.push(new Bubble(random(width), random(height)));
    }
}

function draw() {
    // 배경 - 어두운 페이드 효과
    background(0, 15);

    // 웨이브 배경 효과
    drawWaveBackground();

    // 마우스 위치
    let mouse = createVector(mouseX, mouseY);

    // 버블 업데이트 및 그리기
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let bubble = bubbles[i];

        // 마우스 근처에 있으면 끌어당기기
        let d = p5.Vector.dist(mouse, bubble.pos);
        if (d < 200) {
            bubble.follow(mouse);
        }

        // 다른 버블들과 상호작용
        for (let j = 0; j < bubbles.length; j++) {
            if (i !== j) {
                let other = bubbles[j];
                let distance = p5.Vector.dist(bubble.pos, other.pos);

                // 너무 가까우면 밀어내기
                if (distance < (bubble.size + other.size) / 2) {
                    let force = p5.Vector.sub(bubble.pos, other.pos);
                    force.normalize();
                    force.mult(0.5);
                    bubble.acc.add(force);
                }

                // 연결선 그리기
                if (distance < 150) {
                    push();
                    colorMode(HSB, 360, 100, 100, 255);
                    let alpha = map(distance, 0, 150, 50, 0);
                    stroke((bubble.hue + other.hue) / 2, 70, 80, alpha);
                    strokeWeight(2);
                    line(bubble.pos.x, bubble.pos.y, other.pos.x, other.pos.y);
                    pop();
                }
            }
        }

        bubble.update();
        bubble.display();
    }

    // 파티클 업데이트 및 그리기
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].display();

        if (particles[i].isDead()) {
            particles.splice(i, 1);
        }
    }

    // 글로벌 효과 업데이트
    waveOffset += 0.02;
    hueOffset = (hueOffset + 0.3) % 360;
}

function drawWaveBackground() {
    push();
    colorMode(HSB, 360, 100, 100, 255);
    noFill();

    for (let i = 0; i < 5; i++) {
        stroke(hueOffset + i * 30, 60, 50, 30);
        strokeWeight(2);
        beginShape();
        for (let x = 0; x <= width; x += 10) {
            let y = height / 2 + sin(x * 0.01 + waveOffset + i * 0.5) * 50 * (i + 1);
            vertex(x, y);
        }
        endShape();
    }
    pop();
}

function mousePressed() {
    // 클릭하면 폭발 효과
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(mouseX, mouseY, random(360)));
    }

    // 새 버블 추가
    bubbles.push(new Bubble(mouseX, mouseY));

    // 너무 많으면 오래된 것 제거
    if (bubbles.length > 50) {
        bubbles.shift();
    }
}

function mouseDragged() {
    // 드래그하면 파티클 트레일
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(mouseX, mouseY, hueOffset));
    }
}

function keyPressed() {
    // R 키를 누르면 리셋
    if (key === 'r' || key === 'R') {
        bubbles = [];
        particles = [];
        for (let i = 0; i < 30; i++) {
            bubbles.push(new Bubble(random(width), random(height)));
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
