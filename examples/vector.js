/*
 * Functions get from http://hint.fm/wind/
 */

var Vector = function (x, y) {
  this.x = x;
  this.y = y;
};

Vector.prototype.length = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

var VectorField = function (field, x0, y0, x1, y1) {
  this.x0 = x0;
  this.x1 = x1;
  this.y0 = y0;
  this.y1 = y1;
  this.field = field;
  this.w = field.length;
  this.h = field[0].length;
  this.maxLength = 0;
  var max = this.maxLength;

  //Boucle pour obtenir la valeur maximale parmi les vecteurs :
  for (var i = this.w; --i;) {
    for (var j = this.h; --j;) {
      if (field[i][j].length() > max) {
      }
      max = Math.max(max, field[i][j].length());
    }
  }

  this.maxLength = max;
};

VectorField.read = function (data) {
  var field = [], w = data.gridWidth, h = data.gridHeight, i = 0;
  for (var x = 0; x < w; x++) {
    field[x] = [];
    for (var y = 0; y < h; y++) {
      var vx = data.field[i++];
      var vy = data.field[i++];
      var v = new Vector(vx, vy);
      field[x][y] = v;
    }
  }
  var result = new VectorField(field, data.x0, data.y0, data.x1, data.y1);

  return result;
};


VectorField.prototype.inBounds = function(x, y) {
  return x >= this.x0 && x < this.x1 && y >= this.y0 && y < this.y1;
};


VectorField.prototype.bilinear = function(coord, a, b) {

  if (a < 0 || b < 0){
    console.log("<0");
  }

  var na = Math.floor(a);
  var nb = Math.floor(b);
  var ma = Math.ceil(a);
  var mb = Math.ceil(b);
  var fa = a - na;
  var fb = b - nb;

  return this.field[na][nb][coord] * (1 - fa) * (1 - fb) +
    this.field[ma][nb][coord] * fa * (1 - fb) +
    this.field[na][mb][coord] * (1 - fa) * fb +
    this.field[ma][mb][coord] * fa * fb;
};


VectorField.prototype.getValue = function(x, y) {
  var a = (this.w - 1 - 1e-6) * (x - this.x0) / (this.x1 - this.x0);
  var b = (this.h - 1 - 1e-6) * (y - this.y0) / (this.y1 - this.y0);

  var vx = this.bilinear('x', a, b);
  var vy = this.bilinear('y', a, b);
  return new Vector(vx, vy);
};


var Particle = function(x, y, age) {
  this.x = x;
  this.y = y;
  this.oldX = -1;
  this.oldY = -1;
  this.oldOldX = -1;
  this.oldOldY = -1;
  this.oldOldOldX = -1;
  this.oldOldOldY = -1;
  this.age = age;
  this.rnd = Math.random();
};


/**
 * @param {VectorField} field
 * @param {number} numParticles
 */
var MotionDisplay = function(field, numParticles) {
  this.field = field;
  this.numParticles = numParticles;
  this.maxLength = field.maxLength;
  this.speedScale = 4000;
  this.x0 = this.field.x0;
  this.x1 = this.field.x1;
  this.y0 = this.field.y0;
  this.y1 = this.field.y1;
  this.makeNewParticles(null, true);
  this.colors = [];
  for (var i = 0; i < 256; i++) {
    this.colors[i] = 'rgb(' + i + ',' + i + ',' + i + ')';
    //this.colors[i] = 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')';
  }
};

MotionDisplay.prototype.changeBounds = function(newX0, newX1, newY0, newY1){
  this.x0 = newX0;
  this.x1 = newX1;
  this.y0 = newY0;
  this.y1 = newY1;
};


MotionDisplay.prototype.makeNewParticles = function() {
  this.particles = [];
  for (var i = 0, numParticles = this.numParticles; i < numParticles; i++) {
    this.particles.push(this.makeParticle());
  }
};


MotionDisplay.prototype.makeParticle = function() {
  var safecount = 0;
  var a = Math.random();
  var b = Math.random();

  var x = a * this.x0 + (1 - a) * this.x1;
  var y = b * this.y0 + (1 - b) * this.y1;
  var v = this.field.getValue(x, y);
  return new Particle(x, y, 1 + 40 * Math.random());
};


MotionDisplay.prototype.animate = function(context) {
  this.moveThings();
  this.draw(context);
};


MotionDisplay.prototype.moveThings = function() {
  var speed = .01 * this.speedScale / (2*map.calculScale());
  var field = this.field;
  var particles = this.particles;

  for (var i = particles.length; --i;) {
    var p = particles[i];

    if (p.age > 0 && field.inBounds(p.x, p.y)) {        //si la particule est bien dans la carte et
      var a = field.getValue(p.x, p.y);                 //que son age n'est pas nul =>
      p.x += speed * a.x;                               //mouvement déterminé par vitesse
      p.y += speed * a.y;
      p.age--;                                          //l'age est décrémenté
    } else {
      this.particles[i] = this.makeParticle();          //sinon on en crée une nouvelle où il faut
    }
  };
};


MotionDisplay.prototype.draw = function(context) {
  var me = this;
  var g = context;
  var w = map.getWidth();
  var h = map.getHeight();

  var scale = map.calculScale();

  var proj = new Vector(0, 0);
  var val = new Vector(0, 0);
  g.lineWidth = 0.9;

  for (var i = me.particles.length; --i;) {
    var p = me.particles[i];
    if (!me.field.inBounds(p.x, p.y)) {
      p.age = -2;
      continue;
    }
    var projXY = map.getPixel([p.x,p.y]);
    proj.x = projXY[0];
    proj.y = projXY[1];
    if (proj.x < 0 || proj.y < 0 || proj.x > w || proj.y > h) {
      p.age = -2;
    }

    if (p.oldX != -1) {
      var wind = me.field.getValue(p.x, p.y, val);
      var s = wind.length() / me.maxLength;
      var c = 90 + Math.round(350 * s);
      if (c > 255) {
        c = 255;
      }
      //g.strokeStyle = me.colors[c];
      g.strokeStyle ='rgb(' + 255 + ',' + 255 + ',' + 255 + ')';
      g.beginPath();

      if(p.oldOldX != -1){

        if(p.oldOldOldX != -1){
          g.moveTo(p.oldOldX, p.oldOldY);
          g.lineTo(p.oldOldOldX, p.oldOldoldY);
        }

        g.moveTo(p.oldX, p.oldY);
        g.lineTo(p.oldOldX, p.oldOldY);
      }
      //trace une ligne entre l'emplacement de la particule et l'ancien emplacement.
      g.moveTo(proj.x, proj.y);
      g.lineTo(p.oldX, p.oldY);
      g.stroke();
    }
    p.oldOldOldX = p.oldOldX;
    p.oldOldOldY = p.oldOldY;
    p.oldOldX = p.oldX;
    p.oldOldY = p.oldY;
    p.oldX = proj.x;
    p.oldY = proj.y;
  }
};

