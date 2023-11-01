let p5Sketch = new p5((p) => {
  //Poster variables.
  let posterLayer,
    txts,
    posterTxt = {
      string: `Hydra Microgrant 2022 AR Poster
      
      I proposed a tutorial to create an augmented reality poster that uses the hydra-synth live coding video synth engine within javascript projects. 
      This poster is the result of the tutorial, hopefully it's helpful and shows some of what is possible when you need an augmented reality poster.
      
      The other javascript dependencies in this project are p5.js and MindAR.

      It is based on a project by artist and educator Ted Davis.
      Github repo: 
      https://t.ly/uY5Fk
      Instagram demo: 
      https://t.ly/4wFaZ
      
      This is the original format. 
      Format
      Print: 895 × 1280 mm, F4 (Weltformat)
      Screen: 895 × 1280px
      
      I've previously implemented AR into p5.js with hydra-synth using the A-Frame P5 AR library by Craig Kapp.
      Github repo: 
      https://t.ly/RmbuC
      A-Frame P5 AR Library: 
      https://t.ly/af0iO

      Date: ${p.day()}/${p.month()}/${p.year()}
      Time: ${p.hour()}:${p.minute()}:${p.second()}
      
      To create a QR code to track your AR graphics you could use this one: 
      https://www.qrcode-monkey.com/ 
      
      `,
    };

  //Variables for hydra sketch.
  let h1;
  let hydraCG;
  let hydraImg;
  let hydraCanvas;

  //Custom shape variables.
  let shapeMask;
  let shapeVerts = [];
  const numPoints = 20;
  let centerPoint;

  //Global time variables.
  let seconds;
  let refreshRate = 25;
  let showBG = false;

  p.preload = () => {
    //Instantiate hydra-synth first
    h1 = new Hydra({
      canvas: document.getElementById("hydra_canvas"),
      detectAudio: false,
      makeGlobal: false,
    }).synth;
  };

  p.setup = () => {
    p.frameRate(refreshRate);
    p.pixelDensity(1);
    p.createCanvas(895, 1280);
    //p.createCanvas(p.min(p.windowWidth), p.min(p.windowHeight));

    //To render hydra graphics onto then access within p5 as an image later.
    hydraCG = p.createGraphics(p.width, p.height);

    //To define the custom shape we'll isolate the hydra graphics to appear restricted within.
    shapeMask = p.createGraphics(p.width, p.height);

    //To render all the graphics onto the AR poster.
    posterLayer = p.createGraphics(
      p.width,
      p.height,
      p.P2D,
      document.getElementById("canvas")
    );

    //Split poster text by paragraph.
    txts = posterTxt.string.split("\n\n");

    //Change from the p5 defaults.
    p.rectMode(p.CENTER);
    p.textAlign(p.CENTER);

    initialiseCustomShape();
  };

  // Initialise the custom shape's points with number defined in the numPoints variable.
  function initialiseCustomShape() {
    for (let i = 0; i < numPoints; i++) {
      shapeVerts.push(createPoint());
    }
  }

  // Create a point with random co-ords then adjust.
  function createPoint(tx, ty) {
    return {
      x: tx || p.random(shapeMask.width),
      y: ty || p.random(shapeMask.height),
      adjust(d) {
        if (d >= shapeMask.width) {
          //calculateCenter();
          this.adjustX();
          this.adjustY();
        }
      },
      adjustX() {
        this.x =
          p.abs(p.sin(p.frameCount * 0.01)) * p.random(shapeMask.width * 1.5);
      },
      adjustY() {
        this.y =
          p.abs(p.sin(p.frameCount * 0.01)) * p.random(shapeMask.height * 1.5);
      },
    };
  }

  // Calculate the center point of the custom shape.
  function calculateCenter() {
    let count = 0;
    let totalX = 0;
    let totalY = 0;
    for (let i = 0; i < shapeVerts.length; i++) {
      let pt = shapeVerts[i];
      count++;

      let shapeScale = 0;
      let ang = p.noise(pt.x * shapeScale, pt.y * shapeScale, 0.75) * 0.02;
      let off =
        p.noise(pt.x * shapeScale, pt.y * shapeScale, 0.75) * p.random(25, 50); //speed of movement of the shape

      // Update the totalX and totalY values based on the noise-generated movement.
      totalX += pt.x +=
        p.cos(ang / 2) *
        off *
        p.noise(0.1) *
        p.abs(p.sin(p.frameCount % 0.0001)) *
        shapeMask.width;
      totalY += pt.y +=
        p.sin(ang / 2) *
        off *
        p.noise(0.1) *
        p.abs(p.sin(p.frameCount % 0.0001)) *
        shapeMask.height;
    }
    // Return the average position of the shape's vertices.
    return shapeMask.createVector(totalX / count, totalY / count);
  }

  // Draw the custom shape by connecting vertices with bezier curves.
  function drawCustomShape(points, numVertices) {
    shapeMask.beginShape();
    for (let i = 0; i < numVertices; i++) {
      if (i === 0) {
        shapeMask.vertex(points[(i.x, i.y)]);
      } else {
        bezierVertexP(points[i], points[i], points[i + 1]);
        i += 2; // Skip two points for the bezierVertex
      }
    }
    shapeMask.endShape();
  }

  // Define a custom function for the bezierVertex.
  function bezierVertexP(a, b, c) {
    shapeMask.bezierVertex(a.x, a.y, b.x, b.y, c.x, c.y);
  }

  function drawGlasses(centerPoint) {
    p.push();
    shapeMask.stroke(255);
    shapeMask.fill(255);

    // Draw glasses frames
    shapeMask.rect(centerPoint.x + 50, centerPoint.y, 50, 20);
    shapeMask.rect(centerPoint.x - 50, centerPoint.y, 50, 20);
    shapeMask.noStroke();
    shapeMask.fill(255);

    // Draw glasses arms
    shapeMask.rect(centerPoint.x + 50, centerPoint.y, 2.5);
    shapeMask.rect(centerPoint.x - 50, centerPoint.y, 2.5);

    // Draw glasses bridge
    shapeMask.stroke(255);
    shapeMask.line(
      centerPoint.x - 25,
      centerPoint.y + 10,
      centerPoint.x + 50,
      centerPoint.y + 10
    );
    p.pop();
  }

  // Adjust the positions of custom shape points based on distance from a random point.
  function adjustCustomShapePoints() {
    for (let i = 0; i < shapeVerts.length; i++) {
      let pt = shapeVerts[i];
      let d = p.dist(pt.x, pt.y, p.random(p.width), p.random(p.height));
      pt.adjust(d); // Adjust the point's position
    }
  }

  function selectHydraGraphicsMaskShape() {
    shapeMask.clear();
    hydraCG.clear();
    p.clear();

    //The main shape will be filled with hydra
    drawCustomShape(shapeVerts, 10);

    //Second shape outline only no fill
    p.push();
    shapeMask.noFill();
    shapeMask.strokeCap(p.SQUARE);
    shapeMask.strokeWeight(2.5);
    shapeMask.stroke(
      255,
      p.abs(p.sin(p.frameCount * 0.01)) * p.random(90, 100)
    );
    
    //Call the custom shape function again using remaining elements from shapeVerts array
    drawCustomShape(shapeVerts.slice(10), shapeVerts.length - 10); 
    p.pop();

    //Additional custom shape functions to animate the shape
    drawGlasses(centerPoint);
    adjustCustomShapePoints();

    //Store what is being rendered on the canvas with id="hydra_canvas" in hydraImg variable
    hydraImg = hydraCG.select("#hydra_canvas");
    
    //Draw hydraImg onto the hydraCG instance 
    hydraCG.image(hydraImg, 0, 0, shapeMask.width, shapeMask.height);

    //Reassign the hydraImg variable into a p5 image object rendering from hydraCG
    hydraImg = p.createImage(hydraCG.width, hydraCG.height);

    //Copy the contents of hydraCG to hydraImg 
    hydraImg.copy(hydraCG, 0, 0, p.width, p.height, 0, 0, p.width, p.height);

    //Apply a mask of hydra to only render on the bezier custom shape defined in shapeMask 
    hydraImg.mask(shapeMask);

    //Display the masked hydraImg on the main canvas
    p.image(hydraImg, 0, 0);
  }

  function renderHydra() {
    //Alternate between hydra sketches based on time

    if (seconds % 10 == 0) {
      // Check if 10 seconds have passed

      showBG = !showBG;
    }
    if (showBG) {
      posterLayer.blendMode(p.DIFFERENCE); // interesting interaction with the p5.js difference blend mode and hydra sketch

      //Define a custom shader written in GLSL to run in hydra
      h1.setFunction({
        name: "modulateSR",
        type: "combineCoord",
        inputs: [
          {
            type: "float",
            name: "multiple",
            default: 1,
          },
          {
            type: "float",
            name: "offset",
            default: 1,
          },
          {
            type: "float",
            name: "rotateMultiple",
            default: 1,
          },
          {
            type: "float",
            name: "rotateOffset",
            default: 1,
          },
        ],
        glsl: `   vec2 xy = _st - vec2(0.5);
   float angle = rotateOffset + _c0.z * rotateMultiple;
   xy = mat2(cos(angle),-sin(angle), sin(angle),cos(angle))*xy;
   xy*=(1.0/vec2(offset + multiple*_c0.r, offset + multiple*_c0.g));
   xy+=vec2(0.5);
   return xy;`,
      });

      h1.osc(60, 0.01)
      //Call the custom shader function like you would any other hydra source
        .modulateSR(h1.noise(3).luma(0.5, 0.075), 1, 1, Math.PI / 2) //luma better than thresh no jagg edges
        .out(h1.o0);
    }
    if (!showBG) {
      posterLayer.blendMode(p.BLEND); //The default blend mode

      h1.src(h1.o0)
      //Generate visual feedback in hydra-synth
        .modulateHue(h1.src(h1.o0).scale(1.1), 1)
        .layer(
          h1
            .solid(0, 0, 0.75)
            .invert()
            .diff(h1.osc(5, 0.5, 5))
            .modulatePixelate(h1.noise(5), 2)
            .luma(0.005, 0)
            .mask(h1.shape(4, 0.125, 0.01).modulate(h1.osc([99, 5])))
        )
        .out(h1.o0);
    }
  }

  p.draw = () => {
    p.randomSeed(2);
    centerPoint = calculateCenter();
    seconds = p.frameCount / refreshRate;

    runPosterBg();
    renderHydra();
    selectHydraGraphicsMaskShape();
    animateText();

    posterLayer.image(
      p.get(0, 0, p.width, p.height),
      0,
      0,
      posterLayer.width,
      posterLayer.height
    );
  };

  // The background for the poster using p5
  function runPosterBg() {
    // Add a gradient background
    for (let i = 0; i <= posterLayer.height; i++) {
      let interpolate = p.map(
        i,
        0,
        p.height / (p.sin(p.frameCount * 0.025) * 2),
        0,
        1
      );
      let rVal = p.abs(p.sin(p.frameCount * 0.01) * 0);
      let gVal = 0;
      // Interpolate the colour between
      let lerpC = p.lerpColor(
        p.color(p.abs(p.sin(p.frameCount * 0.01) * 255), 255),
        p.color(rVal, gVal, p.abs(p.sin(p.frameCount * 0.01) * 255)),
        interpolate
      );
      posterLayer.stroke(lerpC);

      posterLayer.rect(
        -posterLayer.width / (p.sin(p.frameCount * 0.01) * 2),
        i,
        posterLayer.width * 1.5,
        i / 2
      );
      posterLayer.rect(
        -posterLayer.width / (p.sin(p.frameCount * 0.01) * 2),
        -i,
        posterLayer.width * 1.5,
        -i / 2
      );
    }
  }

  function animateText() {
    for (let i = 0; i < txts.length; i++) {
      let y =
        p.map(i, 0, txts.length, 0, p.height) +
        p.sin(i * 50 + p.frameCount * 0.02) * p.random(0, p.height);

      let x =
        p.random(0, p.width / 2) -
        ((p.frameCount * p.random(0.5, 5) + p.random(p.width)) % p.width) / 0.2;

      posterLayer.fill(255);
      posterLayer.stroke(p.abs(p.sin(p.frameCount * 0.1)) * 128);
      posterLayer.strokeWeight(5.0);
      posterLayer.textFont("monospace");
      posterLayer.textSize(p.abs(p.sin(p.frameCount * 0.01) * 75)); //oscillate txt size w/ sin function
      posterLayer.text(txts[i], x, x);
    }
  }
});
