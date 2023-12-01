// IAT 806 Final Project - by Amineh Ahmadi Nejad
// A set of self-reflecting Kaleidoscopes that portray a sillhouette of your body using BodyPix from:

// Copyright (c) 2020 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT



let bodypix;
let video;
let segmentation;

// menu options
let imgs = [];
let stateChoices = ["menu", "clean", "delaunay", "mirror"];
let state = "menu";
let aSlider, nSlider, resSlider, txt;

// variables
let a = 50,
  res = 20,
  n = 20;
let xs = [];
let ys = [];
let triangles = [];


// Bodypix parameters
const options = {
  outputStride: 8, // 8, 16, or 32, default is 16
  segmentationThreshold: 0.3, // 0 - 1, defaults to 0.5
};

function videoReady() {
  bodypix.segment(video, gotResults);
}


// models and images for the menu
function preload() {
  bodypix = ml5.bodyPix(options);
  imgs.push(loadImage("clean.png"));
  imgs.push(loadImage("delaunay.png"));
  imgs.push(loadImage("mirror.png"));
}


function setup() {
  createCanvas(320 * 2, 240 * 2, WEBGL);

  // load up your video
  video = createCapture(VIDEO, videoReady);
  video.size(width, height);
  // video.position(width, 0);
  video.hide();

  nSlider = createSlider(1, 200, 100);
  aSlider = createSlider(10, 200, 60);
  resSlider = createSlider(10, 100, 20);
  txt = createDiv("Press any key to get back to Menu");
}


function draw() {
  translate(-width / 2, -height / 2);

  if (state == "menu") 
    runMenu();
  else if (state == "clean")
    runClean();
  else if (state == "delaunay")
    runDelaunay();
  else if (state == "mirror")
    runMirror();
}


// runs menu page, by clicking on each image state changes to that 
function runMenu() {
  // hide extra things to have a clean menu
  video.hide();
  nSlider.hide();
  aSlider.hide();
  resSlider.hide();
  txt.hide();
  
  background(0);
  noStroke();
  let m = 20; // margin
  
  texture(imgs[0]);
  rect(m, height / 2, (width-2*m) / 3, height / 3);
  texture(imgs[1]);
  rect(m + (width-2*m) / 3, height / 2, (width-2*m) / 3, height / 3);
  texture(imgs[2]);
  rect(m+2*(width-2*m) / 3, height / 2, (width-2*m) / 3, height / 3);
  
  // fill(0, 0);
  stroke(255);
  if (mouseX >= m && mouseX <= m+(width-2*m) / 3 &&
     mouseY >= height / 2 && mouseY <= height/2 + height/3){
    texture(imgs[0]);
    rect(0, height / 2 - m, (width-2*m) / 3 + 2*m, height / 3 + 2*m);
    
    if (mouseIsPressed){
      state = "clean";
      background(0);
    }
      }
  else if(mouseX >= m+(width-2*m) / 3 && mouseX <= m+2*(width-2*m) / 3 &&
     mouseY >= height / 2 && mouseY <= height/2 + height/3){
    texture(imgs[1]);
    rect((width-2*m) / 3, height / 2 - m, 2*m+(width-2*m) / 3, 2*m+height / 3);
    
    if (mouseIsPressed){
      state = "delaunay";
      background(0);
    }
  }
  
  else if(mouseX >= m+2*(width-2*m) / 3 && mouseX <= width-m &&
     mouseY >= height / 2 && mouseY <= height/2 + height/3){
    texture(imgs[2]);
  rect( 2*(width-2*m) / 3, height / 2-m, 2*m+(width-2*m) / 3, 2*m+height / 3);

    if (mouseIsPressed){
      state = "mirror";
      background(0);
    }
  }
}


// runs first kaleidoscope: simple, with circles masking the background, reminding a classic toy with real time and slow movement at the same time
function runClean() {
  aSlider.show();
  resSlider.show();
  txt.show();
  
  a = aSlider.value();
  res = resSlider.value();
  let odd = 0;
  for (let j = 0; j <= height + a; j += (a * sqrt(3)) / 2) {
    for (let i = 0; i <= width + a; i += 3 * a) {
      let x = i + 1.5 * a * (odd % 2);
      let y = j;
      tries(x, y, 1);
    }
    odd++;
  }

  if (segmentation) {
    loadPixels();
    segmentation.backgroundMask.loadPixels();

    for (let j = 0; j <= height + res; j += res) {
      for (let i = 0; i < width; i += res) {
        let idx = (j * width + i) * 4;
        if (segmentation.backgroundMask.pixels[idx + 3] == 0) {
          fill(0, 230);
          circle(i, j, res * 1.2);
        }
      }
    }
  }
}


// second Kaleidescope: (messy, convex)
// chooses n random points inside the body, and uses Delaunay triangulation to make a convex triangulation of the points. Of course, using video as  texture.
function runDelaunay(){
  nSlider.show();
  txt.show();
  n = nSlider.value();

  let points = [];

  if (segmentation) {
    if (frameCount % 30 == 0) {
      background(0);
      loadPixels();
      segmentation.backgroundMask.loadPixels();

      for (let i = 0; i < n; i++) {
        let x = Math.round(random(width));
        let y = Math.round(random(height));
        let idx = (y * video.width + x) * 4;
        if (segmentation.backgroundMask.pixels[idx + 3] == 0 || (x%width) == 0 || (y%height) == 0) {
          // outside body
          i--;
          continue;
        } else {
          points.push([x, y]);
          // circle(x, y, 5);
        }
      }
    }

    triangles = Delaunay.triangulate(points);
  }

  for (let i = 0; i < triangles.length; i += 3) {
    push();
    texture(video);
    let w = width;
    let h = height;

    beginShape();
    vertex(points[triangles[i]][0], points[triangles[i]][1], 0, 0, 0);
    vertex(points[triangles[i + 1]][0], points[triangles[i + 1]][1], 0, 0, h);
    vertex(points[triangles[i + 2]][0], points[triangles[i + 2]][1], 0, w, h);
    endShape(CLOSE);
    pop();
  }
}


// last Kaleidoskope: Spheres with brightness as size and video as texture
// no lags, less of a Kaleidescope, more of a mirror, simply elegant.
function runMirror(){
  background(0);
  txt.show();
  resSlider.show();
  let n = resSlider.value();
  if (video) {
    video.loadPixels();

    for (let j = 0; j <= height; j += n) {
      for (let i = 0; i <= width; i += n) {
        let idx = (j * width + i) * 4;
        let r = video.pixels[idx];
        let d = map(r, 0, 255, n/10, n);
        texture(video);
        noStroke();
        push();
        translate(i, j, 0);
        rotateY(PI);
        sphere(d);
        pop();
      }
    }
  }
}

// for segmenting body sillhouette
function gotResults(error, result) {
  if (error) {
    console.log(error);
    return;
  }
  segmentation = result;
  bodypix.segment(video, gotResults);
}


// draws 6 triangles of length a vertice, with texture video around point(x, y)
function tries(x, y, bck) {
  noFill();
  noStroke();
  push();
  translate(x, y);
  for (let i = 0; i < 6; i++) {
    if (bck) {
      texture(video);
      let w = video.width;
      let h = video.height;
      if (i % 2) {
        beginShape();
        vertex(-a / 2, (-a * sqrt(3)) / 2, 0, 0, 0);
        // vertex(-a / 2, (-a * sqrt(3)) / 2, 0, w, 0);
        vertex(a / 2, (-a * sqrt(3)) / 2, 0, w, h);
        vertex(0, 0, 0, 0, h);
        endShape(CLOSE);
      } else {
        beginShape();
        vertex(-a / 2, (-a * sqrt(3)) / 2, 0, w, h);
        vertex(-a / 2, (-a * sqrt(3)) / 2, 0, w, 0);
        vertex(a / 2, (-a * sqrt(3)) / 2, 0, 0, 0);
        vertex(0, 0, 0, 0, h);
        endShape(CLOSE);
      }
    } else {
      triangle(-a / 2, (-a * sqrt(3)) / 2, a / 2, (-a * sqrt(3)) / 2, 0, 0);
    }
    rotate(PI / 3.0);
  }
  translate(-x, -y);
  pop();
}


function keyTyped(){
  state = "menu";
}

