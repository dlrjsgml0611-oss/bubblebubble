// Seoul Weather Reactive Graphics
// 서울 날씨에 따라 실시간으로 변하는 인터랙티브 그래픽

let weatherData = null;
let particles = [];
let clouds = [];
let stars = [];
let lightningFlash = 0;
let sunAngle = 0;
let lastUpdate = 0;
const UPDATE_INTERVAL = 600000; // 10분마다 업데이트

// 날씨 상태
let currentTemp = 20;
let currentCondition = 'Clear';
let windSpeed = 0;
let humidity = 50;
let isLoading = true;

// 색상 팔레트 (온도에 따라 변함)
let skyColor;
let groundColor;

class Particle {
    constructor(type = 'rain') {
        this.pos = createVector(random(width), random(-100, -10));
        this.type = type;

        switch(type) {
            case 'rain':
                this.vel = createVector(windSpeed * 0.5, random(10, 20));
                this.len = random(10, 20);
                this.weight = random(1, 2);
                this.alpha = random(150, 200);
                break;
            case 'snow':
                this.vel = createVector(windSpeed * 0.3, random(1, 3));
                this.size = random(3, 8);
                this.rotation = random(TWO_PI);
                this.rotationSpeed = random(-0.05, 0.05);
                this.alpha = random(200, 255);
                break;
            case 'cloud':
                this.vel = createVector(windSpeed * 0.1, 0);
                this.size = random(60, 120);
                this.alpha = random(100, 180);
                break;
            case 'dust':
                this.vel = createVector(windSpeed * 2, random(-0.5, 0.5));
                this.size = random(2, 5);
                this.alpha = random(100, 200);
                break;
        }
    }

    update() {
        this.pos.add(this.vel);

        if (this.type === 'snow') {
            this.rotation += this.rotationSpeed;
            this.pos.x += sin(frameCount * 0.05) * 0.5;
        }

        if (this.type === 'dust') {
            this.pos.y += sin(frameCount * 0.05 + this.pos.x) * 0.3;
        }

        // 화면 밖으로 나가면 재배치
        if (this.pos.y > height + 20) {
            this.pos.y = -20;
            this.pos.x = random(width);
        }
        if (this.pos.x > width + 20) {
            this.pos.x = -20;
        }
        if (this.pos.x < -20) {
            this.pos.x = width + 20;
        }
    }

    display() {
        push();

        switch(this.type) {
            case 'rain':
                stroke(150, 180, 255, this.alpha);
                strokeWeight(this.weight);
                line(this.pos.x, this.pos.y,
                     this.pos.x - this.vel.x * 2, this.pos.y - this.len);
                break;

            case 'snow':
                noStroke();
                fill(255, this.alpha);
                translate(this.pos.x, this.pos.y);
                rotate(this.rotation);

                // 눈송이 모양
                for (let i = 0; i < 6; i++) {
                    rotate(PI / 3);
                    line(0, 0, this.size, 0);
                    line(this.size * 0.6, 0, this.size * 0.8, -this.size * 0.2);
                    line(this.size * 0.6, 0, this.size * 0.8, this.size * 0.2);
                }
                break;

            case 'cloud':
                noStroke();
                fill(255, this.alpha);
                ellipse(this.pos.x, this.pos.y, this.size, this.size * 0.6);
                ellipse(this.pos.x + this.size * 0.3, this.pos.y, this.size * 0.8, this.size * 0.5);
                ellipse(this.pos.x - this.size * 0.3, this.pos.y, this.size * 0.7, this.size * 0.5);
                break;

            case 'dust':
                noStroke();
                fill(200, 180, 150, this.alpha);
                circle(this.pos.x, this.pos.y, this.size);
                break;
        }

        pop();
    }
}

class Cloud {
    constructor() {
        this.x = random(-200, width);
        this.y = random(50, height * 0.4);
        this.size = random(100, 250);
        this.speed = random(0.2, 0.8);
        this.opacity = random(0.3, 0.7);
    }

    update() {
        this.x += this.speed + windSpeed * 0.1;
        if (this.x > width + 200) {
            this.x = -200;
            this.y = random(50, height * 0.4);
        }
    }

    display() {
        push();
        noStroke();
        fill(255, this.opacity * 255);

        // 구름 모양 (여러 원으로)
        ellipse(this.x, this.y, this.size, this.size * 0.6);
        ellipse(this.x + this.size * 0.3, this.y - this.size * 0.1, this.size * 0.8, this.size * 0.5);
        ellipse(this.x - this.size * 0.3, this.y - this.size * 0.1, this.size * 0.7, this.size * 0.5);
        ellipse(this.x + this.size * 0.5, this.y, this.size * 0.6, this.size * 0.4);
        ellipse(this.x - this.size * 0.5, this.y, this.size * 0.5, this.size * 0.4);

        pop();
    }
}

class Star {
    constructor() {
        this.x = random(width);
        this.y = random(height * 0.6);
        this.size = random(1, 3);
        this.brightness = random(150, 255);
        this.twinkleSpeed = random(0.02, 0.05);
        this.offset = random(TWO_PI);
    }

    update() {
        this.brightness = 200 + sin(frameCount * this.twinkleSpeed + this.offset) * 55;
    }

    display() {
        push();
        noStroke();
        fill(255, this.brightness);

        // 별 모양
        circle(this.x, this.y, this.size);

        // 반짝임 효과
        stroke(255, this.brightness * 0.5);
        strokeWeight(0.5);
        line(this.x - this.size * 2, this.y, this.x + this.size * 2, this.y);
        line(this.x, this.y - this.size * 2, this.x, this.y + this.size * 2);

        pop();
    }
}

async function fetchSeoulWeather() {
    try {
        // OpenWeatherMap API 사용 (무료)
        // 실제 사용시 API 키를 발급받아 사용하세요
        const API_KEY = 'demo'; // 데모용 - 실제 키로 교체 필요
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${API_KEY}&units=metric&lang=kr`
        );

        if (!response.ok) {
            // API 실패시 랜덤 날씨 생성 (데모용)
            console.log('API 호출 실패, 데모 모드로 전환');
            generateDemoWeather();
            return;
        }

        const data = await response.json();
        updateWeatherData(data);

    } catch (error) {
        console.log('날씨 정보 가져오기 실패, 데모 모드 사용:', error);
        generateDemoWeather();
    }
}

function generateDemoWeather() {
    // 데모용 랜덤 날씨 생성
    const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Thunderstorm', 'Drizzle', 'Mist'];
    const randomCondition = random(conditions);

    weatherData = {
        main: {
            temp: random(-5, 35),
            humidity: random(30, 90)
        },
        weather: [{
            main: randomCondition,
            description: randomCondition
        }],
        wind: {
            speed: random(0, 15)
        }
    };

    updateWeatherData(weatherData);
    isLoading = false;
}

function updateWeatherData(data) {
    currentTemp = data.main.temp;
    currentCondition = data.weather[0].main;
    windSpeed = data.wind.speed;
    humidity = data.main.humidity;

    isLoading = false;

    // 날씨에 따라 파티클 생성
    updateParticles();

    console.log(`서울 날씨: ${currentCondition}, 온도: ${currentTemp}°C, 바람: ${windSpeed}m/s`);
}

function updateParticles() {
    particles = [];

    let particleCount = 0;
    let particleType = 'rain';

    switch(currentCondition) {
        case 'Rain':
        case 'Drizzle':
            particleCount = currentCondition === 'Rain' ? 200 : 100;
            particleType = 'rain';
            break;
        case 'Snow':
            particleCount = 150;
            particleType = 'snow';
            break;
        case 'Thunderstorm':
            particleCount = 300;
            particleType = 'rain';
            break;
        case 'Mist':
        case 'Fog':
        case 'Haze':
        case 'Dust':
            particleCount = 100;
            particleType = 'dust';
            break;
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(particleType));
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    // 구름 생성
    for (let i = 0; i < 8; i++) {
        clouds.push(new Cloud());
    }

    // 별 생성
    for (let i = 0; i < 100; i++) {
        stars.push(new Star());
    }

    // 초기 날씨 정보 가져오기
    fetchSeoulWeather();
}

function draw() {
    // 주기적 업데이트
    if (millis() - lastUpdate > UPDATE_INTERVAL) {
        fetchSeoulWeather();
        lastUpdate = millis();
    }

    // 온도에 따른 배경색 설정
    let bgColors = getTemperatureColors(currentTemp);

    // 시간대 효과 (낮/밤 구분)
    let currentHour = hour();
    let isNight = currentHour < 6 || currentHour > 18;

    if (isNight) {
        // 밤 하늘
        setGradient(0, 0, width, height,
            color(10, 10, 30), color(30, 30, 60));
    } else {
        // 낮 하늘
        setGradient(0, 0, width, height,
            bgColors.sky1, bgColors.sky2);
    }

    // 별 그리기 (밤이거나 맑을 때)
    if (isNight || currentCondition === 'Clear') {
        for (let star of stars) {
            star.update();
            if (isNight) star.display();
        }
    }

    // 태양/달 그리기
    drawSun(isNight);

    // 구름 그리기
    if (currentCondition.includes('Cloud') || currentCondition === 'Clouds') {
        for (let cloud of clouds) {
            cloud.update();
            cloud.display();
        }
    }

    // 번개 효과 (천둥번개)
    if (currentCondition === 'Thunderstorm' && random() < 0.01) {
        lightningFlash = 255;
    }

    if (lightningFlash > 0) {
        push();
        fill(255, 255, 200, lightningFlash);
        rect(0, 0, width, height);

        // 번개 그리기
        stroke(255, 255, 100, lightningFlash);
        strokeWeight(3);
        drawLightning(random(width), 0, random(width), height);

        lightningFlash -= 15;
        pop();
    }

    // 파티클 (비, 눈, 먼지 등)
    for (let p of particles) {
        p.update();
        p.display();
    }

    // 날씨 정보 UI
    drawWeatherUI();

    // 로딩 표시
    if (isLoading) {
        drawLoading();
    }

    sunAngle += 0.001;
}

function setGradient(x, y, w, h, c1, c2) {
    noFill();
    for (let i = y; i <= y + h; i++) {
        let inter = map(i, y, y + h, 0, 1);
        let c = lerpColor(c1, c2, inter);
        stroke(c);
        line(x, i, x + w, i);
    }
}

function getTemperatureColors(temp) {
    let colors = {};

    if (temp < 0) {
        // 매우 추움 - 파란 톤
        colors.sky1 = color(100, 150, 200);
        colors.sky2 = color(150, 180, 230);
    } else if (temp < 10) {
        // 추움 - 시원한 톤
        colors.sky1 = color(120, 170, 220);
        colors.sky2 = color(180, 200, 240);
    } else if (temp < 20) {
        // 시원함 - 밝은 파란색
        colors.sky1 = color(135, 206, 235);
        colors.sky2 = color(200, 230, 255);
    } else if (temp < 28) {
        // 따뜻함 - 맑은 하늘
        colors.sky1 = color(100, 180, 255);
        colors.sky2 = color(180, 220, 255);
    } else {
        // 더움 - 따뜻한 톤
        colors.sky1 = color(255, 180, 100);
        colors.sky2 = color(255, 220, 150);
    }

    return colors;
}

function drawSun(isNight) {
    push();

    let x = width * 0.8;
    let y = height * 0.2;
    let size = 100;

    if (isNight) {
        // 달
        noStroke();
        fill(240, 240, 255, 200);
        circle(x, y, size);

        // 달 크레이터
        fill(220, 220, 240, 100);
        circle(x - 15, y - 10, 20);
        circle(x + 10, y + 15, 15);
        circle(x - 5, y + 20, 18);

    } else {
        // 태양
        // 광선
        stroke(255, 220, 100, 100);
        strokeWeight(2);
        for (let i = 0; i < 12; i++) {
            let angle = (TWO_PI / 12) * i + sunAngle;
            let x1 = x + cos(angle) * size * 0.7;
            let y1 = y + sin(angle) * size * 0.7;
            let x2 = x + cos(angle) * size * 1.2;
            let y2 = y + sin(angle) * size * 1.2;
            line(x1, y1, x2, y2);
        }

        // 태양 본체
        noStroke();
        fill(255, 230, 100, 150);
        circle(x, y, size * 1.3);
        fill(255, 240, 120);
        circle(x, y, size);
    }

    pop();
}

function drawLightning(x1, y1, x2, y2) {
    let segments = 8;
    let lastX = x1;
    let lastY = y1;

    for (let i = 1; i <= segments; i++) {
        let x = lerp(x1, x2, i / segments) + random(-30, 30);
        let y = lerp(y1, y2, i / segments);
        line(lastX, lastY, x, y);
        lastX = x;
        lastY = y;

        // 가지 번개
        if (random() < 0.3) {
            let branchX = x + random(-50, 50);
            let branchY = y + random(20, 60);
            line(x, y, branchX, branchY);
        }
    }
}

function drawWeatherUI() {
    push();

    // 배경 패널
    fill(0, 0, 0, 150);
    noStroke();
    rect(20, 20, 280, 180, 10);

    // 제목
    fill(100, 200, 255);
    textSize(24);
    textAlign(LEFT);
    text('🌏 서울 날씨', 35, 50);

    // 날씨 정보
    fill(255);
    textSize(16);

    let weatherIcon = getWeatherIcon(currentCondition);
    text(`${weatherIcon} ${getWeatherKorean(currentCondition)}`, 35, 85);

    text(`🌡️ 온도: ${currentTemp.toFixed(1)}°C`, 35, 110);
    text(`💨 바람: ${windSpeed.toFixed(1)} m/s`, 35, 135);
    text(`💧 습도: ${humidity}%`, 35, 160);

    // 업데이트 시간
    fill(200);
    textSize(12);
    text('10분마다 자동 업데이트', 35, 185);

    pop();
}

function drawLoading() {
    push();

    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('날씨 정보 불러오는 중...', width / 2, height / 2);

    // 로딩 애니메이션
    noFill();
    stroke(100, 200, 255);
    strokeWeight(4);
    let angle = (frameCount * 0.1) % TWO_PI;
    arc(width / 2, height / 2 + 60, 50, 50, angle, angle + PI);

    pop();
}

function getWeatherIcon(condition) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️',
        'Dust': '💨'
    };
    return icons[condition] || '🌈';
}

function getWeatherKorean(condition) {
    const korean = {
        'Clear': '맑음',
        'Clouds': '흐림',
        'Rain': '비',
        'Drizzle': '이슬비',
        'Thunderstorm': '뇌우',
        'Snow': '눈',
        'Mist': '안개',
        'Fog': '안개',
        'Haze': '실안개',
        'Dust': '먼지'
    };
    return korean[condition] || condition;
}

function mousePressed() {
    // 클릭하면 즉시 날씨 업데이트
    fetchSeoulWeather();
}

function keyPressed() {
    // 스페이스바로 날씨 데모 변경
    if (key === ' ') {
        generateDemoWeather();
    }

    // R 키로 새로고침
    if (key === 'r' || key === 'R') {
        fetchSeoulWeather();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
