(function(window, document, undefined) {
/** @description @2d рисование для Canvas API [es6]
  * @author github.com/xaota
  * @required @class Vector / Matrix
  */
  "use strict";

/** Общее рисование */
  class Context {
    constructor(context) {
      this.context = context;
      this.reset();
    }
  /** Перенос пера @relative */
    move(vector) {
      return this.MOVE(this.pointer.addition(vector));
    }
  /** Перенос пера @absolute */
    MOVE(vector) {
      this.pointer = vector;
      this.context.moveTo(vector.x, vector.y);
      return this;
    }
  /** Линия @relative */
    line(vector) {
      return this.LINE(this.pointer.addition(vector));
    }
  /** Линия @absolute */
    LINE(vector) {
      this.pointer = vector;
      this.context.lineTo(vector.x, vector.y);
      return this;
    }
  /** Группа линий подряд @relative */
    strip(points) {
      points.forEach(p => this.line(p));
      return this;
    }
  /** Группа линий подряд @absolute */
    STRIP(points) {
      points.forEach(p => this.context.lineTo(p.data[0], p.data[1])); // fast
      if (points.length) this.pointer = points.pop();
      return this;
    }
  /** Прямоугольник из текущей позиции пера @relative */
    rect(vector) {
      let point = this.pointer;
      this.context.rect(point.x, point.y, vector.x, vector.y);
      return this;
    }
  /** Прямоугольник из текущей позиции пера @absolute */
    RECT(vector) {
      return this.rect(vector.difference(this.pointer));
    }
  /** Прямоугольник @relative */
    rectangle(A, B) {
      return this.RECTANGLE(A.addition(this.pointer), B);
    }
  /** Прямоугольник @absolute */
    RECTANGLE(A, B) {
      this.context.rect(A.x, A.y, B.x, B.y);
      return this;
    }
  /** Многоугольник @relative */
    poly(points) {
      let head = points[0], zero = this.pointer, ring = zero.addition(head);
      return this.move(head).strip(points).LINE(ring).MOVE(zero);
    }
  /** Многоугольник @absolute */
    POLY(points) {
      let c = this.pointer, n = points.length - 1;
      return this.MOVE(points[n]).STRIP(points).MOVE(c);
    }
  /** Правильный многоугольник */
    regularPoly(n, radius, rotation = 0) {
      let point = new Array(n), c = this.pointer, i = 0, alpha, x, y;
      for (; i < n; ++i) {
        alpha = rotation + 2 * Math.PI * i / n;
        x = c.x + radius * Math.cos(alpha);
        y = c.y + radius * Math.sin(alpha);
        point[i] = Vector.from(x, y);
      }
      return this.POLY(point);
    }
  /** Правильный треугольник */
    regularTriangle(radius, rotation) {
      return this.regularPoly(3, radius, rotation);
    }
  /** Квадрат */
    square(radius, rotation) {
      return this.regularPoly(4, radius, rotation);
    }
  /** Дуга @relative */
    arc(radius, startAngle, endAngle, anticlockwise) {
      return this.ARC(radius, startAngle, startAngle + endAngle, anticlockwise);
    }
  /** Дуга @absolute */
    ARC(radius, startAngle, endAngle, anticlockwise = true) {
      let point = this.pointer;
      this.context.arc(point.x, point.y, radius, startAngle, endAngle, anticlockwise);
      return this;
    }
  /** Угловая дуга @relative */
    arcTo(A, B, radius) {

      return this;
    }
  /** Угловая дуга @absolute */
    ARCTO(A, B, radius) {

      return this;
    }
  /** Сглаживание угла @relative */
    corner(angle, point, radius) {

    }
  /** Сглаживание угла @absolute */
    CORNER(angle, point, radius) {

    }
  /** Эллипс */
    ellipse(a, b, rotation = 0) {
      let point = this.pointer;
      this.context.moveTo(point.x + a * Math.cos(rotation), point.y + b * Math.sin(rotation));
      this.context.ellipse(point.x, point.y, a, b, rotation, 0, Math.PI * 2);
      this.context.moveTo(point.x, point.y);
      return this;
    }
  /** Круг */
    circle(r) {
      return this.ellipse(r, r);
    }
  /** Кубическая кривая Безье @relative */
    cubic(A, B, point) {
      
      return this;
    }
  /** Квадратичная кривая Безье @relative */
    quadr(A, point) {

      return this;
    }
  /** Сброс параметров */
    reset() {
      return this.MOVE(Vector.zero);
    }
  /** Поднятие пера */
    end() {
      this.context.closePath();
      return this;
    }
  }

/** Рисование на холсте */
  class Canvas extends Context {
    constructor(canvas) {
      super(canvas.getContext('2d'));
      this.canvas = canvas;
      this.decore = {};
      this.reset();
    }

    get SIZE() {
      return this._SIZE;
    }
    get VIEW() {
      // let vector = [
      //   this.context.canvas.width,
      //   this.context.canvas.height
      // ];
      // return new Vector(vector.map(Number));
      return this._VIEW;
    }
    get PORT() {
      return {
        size: this.SIZE,
        view: this.VIEW
      }
    }
    get HARD() {
      return this.VIEW.multiplication(this.SIZE.link());
    }
    get CENTER() {
      return this.VIEW.scale(0.5);
    }
  /** Изменение размеров холста */
    size(vector) {
      this.canvas.style.width  = vector.x + 'px';
      this.canvas.style.height = vector.y + 'px';
      this._SIZE = vector;
      return this;
    }
    view(vector) {
      this.context.canvas.width  = vector.x;
      this.context.canvas.height = vector.y;
      this._VIEW = vector;
      return this;
    }
    port(vector) {
      return this.size(vector).view(vector);
    }
    hard(vector) {
      return this.view(this.SIZE.multiplication(vector));
    }
  /** Перевод абсолютных координат в координаты окружения пера */
    coord(vector) { // AB = X
      vector = vector.reverse().resize(3).fill(2, 1);
      return this.matrix.vectorCol(vector).vector().resize(2).reverse();
    }
  /** Перевод координат из окружения пера в абсолютные */
    origin(vector) { // AX = B => X = inverse(A) B
      vector = vector.reverse().resize(3).fill(2, 1);
      return this.matrix.inverse().vectorCol(vector).vector().resize(2).reverse();
    }
  /** Перевод точек из одной СК окружения пера в другую через матрицу перехода */
    static trans(vector, matrix) {
      vector = vector.resize(3).fill(2, 1);
      return matrix.vectorCol(vector).vector().resize(2);
    }
  /** Преобразование СК с переносом пера */
    trans(matrix) {
      this.matrix  = this.matrix.multiply(matrix);
      this.pointer = Canvas.trans(this.pointer, matrix);
      return this;
    }
  /** Перенос начала координат в центр холста @relative */
    center() {
      return this.TO(this.CENTER);
    }
  /** Перенос начала координат в центр холста @absolute */
    basis() {
      return this.reset().center();
    }
  /** Переход к новому базису */
    BASIS(matrix) {
      let A = matrix.col(0), B = matrix.col(1);
      return this.transform(A.x, B.x, A.y, B.y, 1, 1);
    }
  /** Помещение пера на холст */
    begin() {
      this.context.beginPath();
      return this;
    }
  /** Сохранение текущего состояния холста */
    save() {
      this.context.save();
      this.stack.push({
        matrix: this.matrix,
        locate: this.pointer
      });
      return this;
    }
  /** Возврат к предыдущему состоянию холста */
    restore() {
      this.context.restore();
      let last = this.stack.pop();
      this.pointer = last.locate;
      this.matrix  = last.matrix;
      return this;
    }
  /** Изменение стиля рисования */
    style(param) {
      Object.assign(this.decore, param);
      for (let i in param) if (param[i]) this.context[i in dictionary ? dictionary[i] : i] = param[i];
      return this
    }
  /** Работа с тенями */
    shadow(color, {x = 0, y = 0, blur = 0}) {
      this.context.shadowOffsetX = x;
      this.context.shadowOffsetY = y;
      this.context.shadowBlur    = blur;
      this.context.shadowColor   = color;
      return this;
    }
  /** Рисование контура */
    stroke() {
      this.context.stroke();
      return this;
    }
    STROKE(color) {
      var last = this.decore.stroke;
      return this.style({stroke: color}).stroke().style({stroke: last});
    }
    strokePath(path) {
      this.context.stroke(path.context);
      return this;
    }
    STROKEPATH(path, color) {
      var last = this.decore.stroke;
      return this.style({stroke: color}).strokePath(path).style({stroke: last});
    }
  /** Заливка */
    fill() {
      this.context.fill();
      return this;
    }
    FILL(color) {
      var last = this.decore.fill;
      return this.style({fill: color}).fill().style({fill: last});
    }
    fillPath(path) {
      this.context.fill(path.context);
      return this;
    }
    FILLPATH(path, color) {
      var last = this.decore.fill;
      return this.style({fill: color}).fillPath(path).style({fill: last});
    }
  /** Изображение @relative */
    image(image, {point, offset, size, region}) {
      return this.IMAGE(image, {point: this.pointer.addition(point), offset, size, region});
    }
    imageCenter(image, {offset, region, size}) {
      return this.IMAGECENTER(image, {point: this.pointer, offset, size, region});
    }
  /** Изображение @absolute */
    IMAGE(image, {point, offset, size, region}) {
      point  =  point || Vector.zero;
      offset = offset || Vector.zero;
      size   =   size || Vector.from(image.width, image.height);
      region = region || Vector.from(image.width, image.height);
      this.context.drawImage(image, offset.x, offset.y, region.x, region.y, point.x, point.y, size.x, size.y);
      return this;
    }
    IMAGECENTER(image, {point, offset, region, size}) {
      point = point || Vector.zero;
      size  =  size || Vector.from(image.width, image.height);
      point = point.addition(size.reverse().scale(0.5));
      return this.IMAGE(image, {point, size, offset, region});
    }
  /** Ограничение области рисования */
    clip(rule = 'nonzero') {
      this.context.clip(rule);
      return this;
    }
  /** Ограничение области рисования по пути */
    CLIP(path, rule = 'nonzero') {
      this.context.clip(path.context, rule);
    }
  /** Очистка области экрана @absolute */
    clr(A, B) {
      this.context.clearRect(A.x, A.y, B.x, B.y);
      return this;
    }
  /** Очистка области экрана @relative */
    clear(vector) {
      return this.clr(this.pointer, vector);
    }
  /** Очистка всего холста */
    CLEAR() {
      let A = this.coord(Vector.zero);
      let B = this.VIEW;
      return this.clr(A, B);
    }

  /** Перенос центра координат @relative */
    translate(vector) {
      return this.TRANSLATE(this.pointer.addition(vector));
    }
  /** Перенос центра координат @absolute */
    TRANSLATE(vector) {
      let matrix = Matrix.translate(vector, 3);
      this.trans(matrix).context.translate(vector.x, vector.y);
      return this;
    }
  /** Вектор координат переноса */
    get translateVector() {
      // this.matrix.col(2).resize(2)
      return new Vector(this.matrix.element(6, 2));
    }
  /** Масштабирование @relative */
    scale(vector) {
      let matrix = Matrix.scale(vector, 3);
      this.trans(matrix).context.scale(vector.x, vector.y);
      return this;
    }
  /** Масштабирование @absolute */
    SCALE(vector) {
      vector = this.scaleVector.link().multiplication(vector);
      return this.scale(vector);
    }
  /** Равномерное масштабирование @relative */
    zoom(value) {
      return this.scale(Vector.from(value, value));
    }
  /** Равномерное масштабирование @absolute */
    ZOOM(value) {
      return this.SCALE(Vector.from(value, value));
    }
  /** Перевороты */
    flipX() { // горизонталь
      return this.scale(Vector.flipX);
    }
    flipY() { // горизонталь
      return this.scale(Vector.flipY);
    }
  /** Вектор коэффициентов масштабирования */
    get scaleVector() {
      return this.matrix.diagonal().resize(2);
    }
  /** Искажение @relative */
    skew(vector) {
      let m = Matrix.skew(vector, 3).data;
      return this.transform(m[0], m[1], m[3], m[4], m[6], m[7]);
    }
  /** Искажение @absolute */
    SKEW(vector) {
      let m = this.matrix.data;
      return this.TRANSFORM(m[0], vector.x, vector.y, m[4], m[6], m[7]);
    }
  /** Вектор коэффициентов искажения */
    get skewVector() {
      let x = this.matrix.get(1, 0),
          y = this.matrix.get(0, 1);
      return Vector.from(x, y);
    }
  /** Поворот @relative */
    rotate(angle) {
      let matrix = Matrix.rot(angle, 3);
      this.trans(vector, matrix).context.rotate(angle);
      return this;
    }
  /** Поворот @absolute влияет на значения skew и scale */
    ROTATE(angle) { 
      let m = Matrix.rot(angle, 3).fill(6, this.translateVector.data).data; // fast
      return this.TRANSFORM(m[0], m[1], m[3], m[4], m[6], m[7]);
    }
  /** Поворот вокруг точки @todo */
    rotateFrom(vector) {
      return this.rotate(Math.atan(vector.y / vector.x));
    }
  /** Матрица коэффициентов поворота */
    get rotateMatrix() {
      // let skew = this.skewVector, scale = this.scaleVector;
      // return Matrix([scale.x, skew.x, skew.y, scale.y]);
      return this.matrix.minor(2, 2);
    }
  /** Трансформация @relative */
    transform(a, b, c, d, e, f) {
      let matrix = transformMatrix(a, b, c, d, e, f);
      this.trans(matrix).context.transform(a, b, c, d, e, f);
      return this;
    }
  /** Трансформация @absolute */
    TRANSFORM(a, b, c, d, e, f) {
      if (!arguments.length) return this.TRANSFORM(1, 0, 0, 1, 0, 0);
      let pointer = this.origin(this.pointer), last = this.stack.length - 1;
      this.stack[last] = this.matrix = transformMatrix(a, b, c, d, e, f);
      this.pointer = this.coord(pointer);
      this.context.setTransform(a, b, c, d, e, f);
      return this;
    }
  /** Перенос центра координат и перевод туда пера @relative */
    to(vector) {
      return this.translate(vector).MOVE(Vector.zero);
    }
  /** Перенос центра координат и перевод туда пера @absolute */
    TO(vector) {
      return this.TRANSLATE(vector).MOVE(Vector.zero);
    }
  /** Сброс параметров холста */
    reset() {
      this.stack  = []; // transforms
      this.matrix = Matrix.identity(3);
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      return super.reset();
    }
  /** Нахождение точки в нарисованной области (текущая СК) @absolute */
    In(vector) {
      return this.inPath(this.origin(vector));
    }
  /** Нахождение точки в нарисованной области (основная СК) @relative */
    in(vector) {
      return this.context.isPointInPath(vector.x, vector.y);
    }
  /** Нахождение точки в области нарисованного пути (текущая СК) @absolute */
    InPath(path, vector, rule) {
      return this.inPath(path, this.origin(vector), rule);
    }
  /** Нахождение точки в нарисованной области (основная СК) @relative */
    inPath(path, vector, rule = 'nonzero') {
      return this.context.isPointInPath(path.context, vector.x, vector.y, rule);
    }
  /** Нахождение точки в области нарисованного пути (текущая СК) @absolute */
    InStroke(vector) {
      return this.inStroke(this.origin(vector));
    }
  /** Нахождение точки в нарисованной области (основная СК) @relative */
    inStroke(vector) {
      return this.context.isPointInStroke(vector.x, vector.y);
    }
  /** Нахождение точки в области нарисованного пути (текущая СК) @absolute */
    InStrokePath(path, vector) {
      return this.inStrokePath(path, this.origin(vector));
    }
  /** Нахождение точки в нарисованной области (основная СК) @relative */
    inStrokePath(path, vector) {
      return this.context.isPointInStroke(path.context, vector.x, vector.y);
    }
  /** Радиальный градиент @relative */
    radial(radius, start, finish) {
      let P = this.pointer,
        grd = this.GrdRad(P, P, Vector.from(0, radius));
      grd.addColorStop(0, start);
      grd.addColorStop(1, finish);
      return grd;
    }
    gradientRadial(B, R) {
      B = this.pointer.addition(B);
      return this.GrdRad(this.pointer, B, R);
    }
    grdRad(A, B, R) {
      A = this.pointer.addition(A);
      B = this.pointer.addition(B);
      return this.GrdRad(A, B, R);
    }
  /** Радиальный градиент @absolute */
    RADIAL(point, radius, start, finish) {
      let grd = this.GrdRad(point, point, Vector.from(0, radius));
      grd.addColorStop(0, start);
      grd.addColorStop(1, finish);
      return grd;
    }
    GradientRadial(B, R) {
      return this.GrdRad(this.pointer, B, R);
    }
    GrdRad(A, B, R) {
      return this.context.createRadialGradient(A.x,A.y,R.x, B.x,B.y,R.y);
    }
  /** Получает ширину строки */
    measure(string) {
      return this.context.measureText(string).width;
    }
  /** Заливка текста @relative */
    fillText(string, width) {
      return this.FILLTEXT(string, this.pointer, width);
    }
    FillText(string, point, width) {
      point = this.pointer.addition(point);
      return this.FILLTEXT(string, point, width);
    }
  /** Заливка текста @absolute */
    FILLTEXT(string, point, width) {
      this.context.fillText(string, point.x, point.y, width);
      return this;
    }
  /** Обвод текста @relative */
    strokeText(string, width) {
      return this.STROKETEXT(string, this.pointer, width);
    }
    StrokeText(string, point, width) {
      point = this.pointer.addition(point);
      return this.STROKETEXT(string, point, width);
    }
  /** Обвод текста @absolute */
    STROKETEXT(string, point, width) {
      this.context.strokeText(string, point.x, point.y, width);
      return this;
    }
  }

/** Рисование путей */
  class Path extends Context {
    constructor(path) {
      super(new Path2D(path));
    }
  }

/** @section Export */
  window.Canvas      = Canvas;
  window.Canvas.path = path => new Path(path);

/** Common */
  const dictionary = {
    fill  : 'fillStyle',
    stroke: 'strokeStyle',
    width : 'lineWidth',
    cap   : 'lineCap',
    join  : 'lineJoin',
    text  : 'fillTextStyle',
    base  : 'textBaseline',
    align : 'textAlign',
    comp  : 'globalCompositeOperation',
    alpha : 'globalAlpha'
  }; // font, shadow@

  function transformMatrix(a, b, c, d, e, f) {
    let array = [a,b,0, c,d,0, e,f,1];
    return new Matrix(array, 3, 3);
  }
})(window, document);
