(function(window, document, undefined) {
/** @description Браузерная математика: Векторы, Кватернионы и Матрицы, полезно для @2d и @3d [es6]
  * @author github.com/xaota
  * @types
  * * {integer} <-> {number} - целые числа
  * * {natural} <-> {number} - натуральные числа и ноль, т.е., {unsigned int} // ноль не натуральное число
  * * {Object#MatrixData} - Объект, возвращаемый методом Гаусса
        width         {number} число столбцов расширенной матрицы, с которыми производилась работа
        matrix        {Matrix} итоговая расширенная матрица
        determinant   {number} определитель матрицы
        rank          {number} ранг матрицы
        swap          {number} число перестановок строк в процессе применения метода Гаусса
        history {array of any} история операций со строками
  * @todo Ещё гора чего не описана. +этим тегом помечаю кандидаты на оптимизацию, переписывание и т. д.
  * @feature Цепочные вызовы, типа `Vector.from(1,2,3).scale(2).reverse().normalize()`
  */
  "use strict";
/** @section {Vector}  Работа с векторами
  * @this dimension   {natural} размерность вектора
  * @this data   {Float32Array} координаты вектора
  */
  class Vector {
  /** Вектор из массива координат
    * @param array {Float32Array} данные координат вектора
    * @return {Vector}
    */
    constructor(array) {
      this.data = new Float32Array(array);
      this.dimension = array.length;
    }
  /** @subsection @field Индексы вектора по осям */
    get x() { return this.data[0] }
    get y() { return this.data[1] }
    get z() { return this.data[2] }
    get w() { return this.data[3] }
    set x(value) { this.data[0] = value }
    set y(value) { this.data[1] = value }
    set z(value) { this.data[2] = value }
    set w(value) { this.data[3] = value }
  /** @subsection @method */
  /** Копия вектора
    * @return {Vector}
    */
    copy() {
      return new Vector(this.data);
    }
  /** Объект с индексами вектора по осям
    * @return {Object}
    */
    symbol() {
      let result = {}, n = Math.min(this.dimension, vectorIndex.length);
      this.data.slice(0, n).forEach((e, i) => result[vectorIndex.charAt(i)] = e);
      return result;
    }
  /** Проверка на нулевой вектор
    * @return {Boolean}
    */
    empty() {
      return this.data.every(isZero);
    }
  /** Проверка на единичный базисный вектор
    * @return {Boolean}
    */
    basis() {
      return this.data.some(isUnit) && (this.data.filter(isZero).length === this.dimension - 1);
    }
  /** Норма вектора
    * @return {number}
    */
    norm() {
      return this.data.reduce(square, 0);
    }
  /** Длинна вектора
    * @return {number}
    */
    length() {
      return Math.hypot(...this.data); // Math.sqrt(this.norm());
    }
  /** Нормализация вектора
    * @return {Vector} сонаправленный с исходным единичный вектор
    */
    normalize() {
      let length = this.length();
      return length === 0
        ? Vector.empty(this.dimension)
        : this.scale(1 / length);
    }
  /** Сопряжённый вектор (1 / vector)
    * @return {vector}
    */
    link() {
      return new Vector(this.data.map(e => e === 0 ? 0 : 1 / e));
    }
  /** Обратный вектор
    * @return {Vector}
    */
    reverse() {
      return new Vector(this.data.map(e => -e));
    }
  /** Изменение размерности вектора @todo
    * уменьшение - хвостовые значения отбрасываются
    * увеличение - координаты инициализируются нулями
    * @param dimension {natural} размерность вектора
    * @return {Vector}
    */
    resize(dimension) {
      let data = new Float32Array(dimension), n = Math.min(dimension, this.dimension), i = 0;
      for (; i < n; ++i) data[i] = this.data[i];
      return new Vector(data);
    }
  /** Заполнение координат вектора новыми значениями
    * @param index {natural} позиция первого из заменяемых элементов в списке координат
    * @arguments {number} новые значения координат
    */
    fill(index, ...coord) {
      let data = this.data.slice();
      coord.forEach((e, i) => data[index + i] = e);
      return new Vector(data);
    }
  /** Умножение вектора на скаляр (масштабирование вектора)
    * @param factor {number} множитель (коэффициент масштабирования)
    * @return {Vector}
    */
    scale(factor) {
      return new Vector(this.data.map(e => e * factor));
    }
  /** Сложение векторов
    * @param vector {Vector} слагаемое
    * @return {Vector}
    */
    addition(vector) {
      return new Vector(this.data.map((e, i) => e + vector.data[i]));
    }
  /** Сложение векторов (с приведением размерностей)
    * @param vector {Vector} слагаемое
    * @return {Vector}
    */
    add(vector) {
      let n = Math.max(this.dimension, vector.dimension);
      return this.resize(n).addition(vector.resize(n))
    }
  /** Разность векторов
    * @param vector {Vector} вычитаемое
    * @return {Vector}
    */
    difference(vector) {
      return this.addition(vector.reverse());
    }
  /** Разность векторов (с приведением размерностей)
    * @param vector {Vector} вычитаемое
    * @return {Vector}
    */
    diff(vector) {
      return this.add(vector.reverse());
    }
  /** Скалярное умножение векторов
    * @param vector {Vector} множитель
    * @return {Vector}
    */
    scalar(vector) {
      return this.data.reduce((result, e, i) => result + e * vector.data[i], 0);
    }
  /** Скалярное умножение векторов (с приведением размерностей)
    * @param vector {Vector} множитель
    * @return {Vector}
    */
    mult(vector) {
      let n = Math.max(this.dimension, vector.dimension);
      return this.resize(n).scalar(vector.resize(n));
    }
  /** Векторное умножение (при размерности 3)
    * @param vector {Vector} множитель
    * @return {Vector}
    */
    multiply(vector) {
      let A = this, B = vector, a, b;
      a = Vector.from(A.z * B.y, A.x * B.z, A.y * B.x);
      b = Vector.from(A.y * B.z, A.z * B.x, A.x * B.y);
      return Vector.to(a, b);
    }
  /** Покомпонентное умножение векторов
    * @param vector {Vector} множитель
    * @return {Vector}
    */
    multiplication(vector) {
      return new Vector(this.data.map((e, i) => e * vector.data[i]));
    }
  /** Покомпонентное умножение векторов (с приведением размерностей)
    * @param vector {Vector} множитель
    * @return {Vector}
    */
    multiplicate(vector) {
      let n = Math.max(this.dimension, vector.dimension);
      return this.resize(n).multiplication(vector.resize(n));
    }
  /** @subsection @method @static */
  /** Вектор из переданных параметров
    * @arguments {number} координаты
    * @return {Vector}
    */
    static from(...coord) {
      return new Vector(coord);
    }
  /** Нулевой (пустой) вектор любой размерности
    * @param dimension {natural} размерность вектора
    * @return {Vector}
    */
    static empty(dimension) {
      return new Vector(new Float32Array(dimension)); // auto.fill(0)
    }
  /** Вектор любой размерности, все элементы которого единицы
    * @param dimension {natural} размерность вектора
    * @return {Vector}
    */
    static identity(dimension) {
      return new Vector((new Float32Array(dimension)).fill(1));
    }
  /** Единичный (базисный) вектор любой размерности
    * @param dimension {natural} размерность вектора
    * @param index     {natural} номер единичной координаты
    * @return {Vector} кроме index все координаты будут нулевыми
    */
    static basis(dimension, index) {
      return Vector.empty(dimension).fill(index, 1);
    }
  /** Вектор из точки A в точку B
    * @param A {Vector} координаты точки A
    * @param B {Vector} координаты точки B
    * @return {Vector}
    */
    static to(A, B) {
      return B.difference(A);
    }
  /** Расстояние между двумя точками
    * @param A {Vector} координаты точки A
    * @param B {Vector} координаты точки B
    * @return {number}
    */
    static distance(A, B) {
      return Vector.to(A, B).length();
    }
  /** Сравнение двух векторов
    * @param A, B {Vector} сравниваемые векторы
    * @return {Boolean}
    */
    static compare(A, B, precision = 0.0001) {
      return A.data.every((e, i) => e - B.data[i] < precision);
    }
  /** Вектор отношения двух векторов (одинаковых размерностей) */
    static relation(A, B) {
      return new Vector(B.data.map((e, i) => e / A.data[i]));
    }
  /** Ортогональные векторы */
    static ortho2(vector) {
      return Vector.from(-vector.y, vector.x);
    }
    static ortho3(A, B) {
      return A.multiply(B);
    }
  /** Единичный вектор нормали к плоскости, заданной тремя точками (a, b, c)
    * @param a {Vector} координаты точки a
    * @param b {Vector} координаты точки b
    * @param c {Vector} координаты точки c
    * @return {Vector}
    */
    static normal(a, b, c) {
      let A = Vector.to(b, a),
          B = Vector.to(b, c);
      return A.multiply(B).normalize().reverse();
    }
  }
  /** @subsection @const Частые значения */
    Vector.x = Vector.basis(2, 0);
    Vector.y = Vector.basis(2, 1);
    Vector.X = Vector.basis(3, 0);
    Vector.Y = Vector.basis(3, 1);
    Vector.Z = Vector.basis(3, 2);
    Vector.zero = Vector.empty(2);
    Vector.ZERO = Vector.empty(3);
    Vector.flipX = Vector.from(-1,  1);
    Vector.flipY = Vector.from( 1, -1);
    Vector.FlipX = Vector.from(-1,  1,  1);
    Vector.FlipY = Vector.from( 1, -1,  1);
    Vector.FlipZ = Vector.from( 1,  1, -1);

/** @section {Quatern} Работа с кватернионами
  * @this  x y z w {number} элементы кватерниона
  */
  class Quatern {
  /** Кватернион из элементов-параметров
    * @param x y z w {number} элементы кватерниона
    * @return {Quatern}
    */
    constructor(x, y, z, w) {
      Object.assign(this, {x, y, z, w});
    }
  /** @subsection @method */
  /** Копия кватерниона
    * @return {Quatern}
    */
    copy() {
      return new Quatern(this.x, this.y, this.z, this.w);
    }
  /** Массив значений элементов кватерниона
    * @return {Float32Array} [x, y, z, w]
    */
    data() {
      return new Float32Array([this.x, this.y, this.z, this.w]);
    }
  /** Норма кватерниона
    * @return {number}
    */
    norm() {
      return this.data().reduce(square, 0);
    }
  /** Модуль кватерниона
    * @return {number}
    */
    absolute() {
      return Math.hypot(this.x, this.y, this.z, this.w); // Math.sqrt(this.norm());
    }
  /** Знак кватерниона
    * @return {Quatern}
    */
    sign() {
      let abs = this.absolute();
      return abs === 0
        ? Quatern.empty
        : this.scale(1 / abs);
    }
  /** Аргумент кватерниона
    * @return {number}
    */
    argument() {
      // arg q = Math.acos(a / q.absolute()), где q = (a, vector)
      return Math.acos(this.w) * 2;
    }

  /** Сопряжённый кватернион
    * @return {Quatern}
    */
    reverse() {
      return new Quatern(-this.x, -this.y, -this.z, this.w);
    }
  /** Обратный (по умножению) кватернион
    * @return {Quatern}
    */
    inverse() {
      let norm = this.norm();
      return norm === 0
        ? Quatern.empty
        : this.reverse().scale(1 / norm);
    }
  /** Умножение кватерниона на скаляр
    * @param factor {number} множитель
    * @return {Quatern}
    */
    scale(factor) {
      return Quatern.data(this.data().map(e => e * factor));
    }
  /** Сложение кватернионов
    * @param quatern {Quatern} слагаемое
    * @return {Quatern}
    */
    addition(quatern) {
      let A = this, B = quatern;
      return new Quatern(A.x + B.x, A.y + B.y, A.z + B.z, A.w + B.w);
    }
  /** Скалярное умножение кватернионов
    * @param quatern {Quatern} множитель
    * @return {Quatern}
    */
    scalar(quatern) {
      let A = this, B = quatern;
      return new Quatern(A.x * B.x, A.y * B.y, A.z * B.z, A.w * B.w);
    }
  /** Умножение кватернионов
    * @param quatern {Quatern} множитель
    * @return {Quatern}
    */
    multiply(quatern) {
      let A = this, B = quatern,
          x = A.w * B.x + A.x * B.w + A.y * B.z - A.z * B.y,
          y = A.w * B.y - A.x * B.z + A.y * B.w + A.z * B.x,
          z = A.w * B.z + A.x * B.y - A.y * B.x + A.z * B.w,
          w = A.w * B.w - A.x * B.x - A.y * B.y - A.z * B.z;
      return new Quatern(x, y, z, w);
    }
  /** @subsection @method @static */
  /** Кватернион из скаляра и трёхмерного вектора
    * @param angle  {number} вещественная составляющая кватерниона
    * @param vector {Vector}    векторная составляющая кватерниона
    * @return {Quatern}
    */
    static from(angle, vector) {
      angle = angle / 2;
      let cos = Math.cos(angle), sin = Math.sin(angle),
        w = cos,
        x = vector.x * sin,
        y = vector.y * sin,
        z = vector.z * sin;
      return new Quatern(x, y, z, w);
    }
  /** Кватернион из элементов массива
    * @param array {Float32Array} массив элементов кватерниона
    * @return {Quatern}
    */
    static data(array) {
      return new Quatern(array[0], array[1], array[2], array[3]);
    }
  }
  /** @subsection @const Частые значения */
    Quatern.empty = new Quatern(0, 0, 0, 0);

/** @section {Matrix}  Работа с матрицами
  * @this height  {natural} количество строк    (высота)
  * @this width   {natural} количество столбцов (ширина)
  * @this data {Float32Array} элементы матрицы (по столбцам)
  */
  class Matrix {
  /** Матрица из элементов массива параметра
    * @param array {Float32Array} данные элементов матрицы (по столбцам)
    * @param height {natural} количество строк    (высота)
    * @param width  {natural} количество столбцов (ширина)
    * @return {Matrix}
    */
    constructor(array, height, width) {
      this.height = height;
      this.width  = width;
      this.data = new Float32Array(array);
    }
  /** @subsection @method */
  /** Вывод матрицы в терминал @debug
    * @return {string} @multiline
    */
    toString(precision = 2) {
      let w = this.width, h = this.height, s = [], i = 0, j, temp,
          d = [].map.call(this.data, e => e.toFixed(precision)),
          l = d.reduce((r, e) => e.length > r ? e.length : r) + 1, c;
      for (; i < h; ++i) {
        temp = [];
        for (j = 0; j < w; ++j) {
          c = d[j * h + i];
          temp.push((new Array(l - c + 1)).join(' ') + c);
        }
        s.push(temp.join(','));
      }
      return '\n' + s.join('\n');
    }
  /** Копирование матрицы
    * @return {Matrix}
    */
    copy() {
      return new Matrix(this.data, this.height, this.width);
    }
  /** Вектор из элементов матрицы
    * @return {Vector}
    */
    vector() {
      return new Vector(this.data);
    }
  /** Транспонирование матрицы
    * @return {Matrix}
    */
    transpose() {
      let h = this.height, w = this.width, array = new Float32Array(w * h), i = 0, j;
      for (; i < w; ++i)
        for (j = 0; j < h; ++j)
          array[j * w + i] = this.data[i * h + j];
      return new Matrix(array, w, h);
    }
  /** След матрицы
    * @return {number}
    */
    trace() {
      let h = this.height, w = this.width, n = Math.min(h, w), r = 0, i = 0;
      for (; i < n; ++i) r += data[i * h + i];
      return r;
    }
  /** Проверка на единичную матрицу
    * @return {Boolean}
    */
    identity() {
      let h = this.height, w = this.width, l = h * w, n = Math.min(h, w);
      return (this.data.filter(isZero).length === l - n) && (this.data.filter(isUnit).length === n);
    }
  /** Проверка на нулевую (пустую) матрицу
    * @return {Boolean}
    */
    empty() {
      return this.data.every(isZero);
    }
  /** Набор вектор-столбцов матрицы
    * @return {array of Vector}
    */
    cols() {
      return Array.from(new Array(this.width), (v, i) => this.col(i));
    }
  /** Набор вектор-строк матрицы
    * @return {array of Vector}
    */
    rows() {
      return this.transpose().cols();
    }
  /** Вектор-столбец матрицы
    * @param index {natural} номер столбца, вектор из элементов которого необходимо получить
    * @return {Vector}
    */
    col(index) {
      let h = this.height, start = index * h, end = start + h;
      return new Vector(this.data.slice(start, end));
    }
  /** Вектор-строка матрицы
    * @param index {natural} номер строки, вектор из элементов которой необходимо получить
    * @return {Vector}
    */
    row(index) {
      return this.transpose().col(index);
    }
  /** Главная диагональ матрицы
    * @return {Vector}
    */
    diagonal() {
      let h = this.height, n = Math.min(h, this.width), array = new Float32Array(n), i = 0;
      array = array.map((e, i) => this.data[h * i + i]);
      return new Vector(array);
    }
  /** Замена главной диагонали матрицы
    * @param vector {Vector} значения для главной диагонали
    * @return {Matrix}
    */
    DIAGONAL(vector) {
      let h = this.height, w = this.width, n = Math.min(h, w), array = this.data.slice(), i = 0;
      for (; i < n; ++i) array[h * i + i] = vector.data[i];
      return new Matrix(array, h, w);
    }
  /** Умножение матрицы на скаляр
    * @param factor {number} коэффициент изменения элементов матрицы
    * @return {Matrix}
    */
    scalar(factor) {
      return new Matrix(this.data.map(e => e * factor), this.height, this.width);
    }
  /** Изменение размеров матрицы
    * уменьшение - элементы за пределами таблицы отбрасываются
    * увеличение - новые элементы инициализируются нулями
    * @param height {natural} количество строк    (высота) матрицы
    * @param width  {natural} количество столбцов (ширина) матрицы
    * @return {Matrix}
    */
    resize(height, width) {
      let h = Math.min(this.height, height), w = Math.min(this.width, width),
        array = new Float32Array(height * width), i = 0, j;
      for (; i < w; ++i)
        for (j = 0; j < h; ++j)
          array[i * height + j] = this.data[i * this.height + j];
      return new Matrix(array, height, width);
    }
  /** Сложение матриц одинакового размера
    * @param matrix {Matrix} прибавляемая матрица
    * @return {Matrix}
    */
    addition(matrix) {
      return new Matrix(this.data.map((e, i) => e + matrix.data[i]), this.height, this.width);
    }
  /** Сложение матриц (с приведением размерностей)
    * @param matrix {Matrix} прибавляемая матрица
    * @return {Matrix}
    */
    add(matrix) {
      let h = Math.max(this.height, matrix.height), w = Math.max(this.width, matrix.width);
      return this.resize(h, w).addition(matrix.resize(h, w));
    }
  /** Умножение согласованных матриц
    * @param matrix {Matrix} матрица-множитель (справа)
    * @return {Matrix}
    */
    multiply(matrix) {
      let h = this.height, w = matrix.width, array = new Float32Array(h * w),
          A = this.rows(), B = matrix.cols(), i = 0, j;
      for (; i < w; ++i)
        for (j = 0; j < h; ++j)
          array[i * h + j] = A[j].scalar(B[i]);
      return new Matrix(array, h, w);
    }
  /** Умножение матриц с приведением размерностей (с предварительным согласованием)
    * @param matrix {Matrix} матрица-множитель (справа)
    * @return {Matrix}
    */
    mult(matrix) {
      let n = Math.max(this.width, matrix.height);
      return this.resize(this.height, n).multiply(matrix.resize(n, matrix.width));
    }
  /** Умножение матрицы на вектор-столбец справа
    * @param vector {Vector} вектор-столбец
    * @return {Matrix} матрица, состоящая из одного вектор-столбца
    */
    vectorCol(vector) {
      return this.multiply(new Matrix(vector.data, vector.dimension, 1));
    }
  /** Умножение матрицы на вектор-строку слева (матрица должна состоять из вектор-столбца)
    * @param vector {Vector} вектор-строка
    * @return {Matrix} Матрица, состоящая из одной вектор строки
    */
    vectorRow(vector) {
      return new Matrix(vector.data, 1, vector.dimension).multiply(this);
    }
  /** Возврат элементов матрицы с любого места (значения хранятся по столбцам)
    * @param start {natural} стартовое значение
    * @param count {natural} количество возвращаемых элементов
    * @return {Float32Array}
    */
    element(start, count) {
      return this.data.slice(start, start + count);
    }
  /** Заполнение элементов матрицы новыми данными с любого места (значения хранятся по столбцам)
    * @param index     {natural} стартовое значение
    * @param data {Float32Array} новые значения элементов матрицы
    * @return {Matrix}
    */
    fill(index, data) {
      let array = this.data.slice();
      data.forEach((e, i) => array[index + i] = e);
      return new Matrix(array, this.height, this.width);
    }
  /** Получение конкретного элемента матрицы по строке и столбцу
    * @param row {natural} номер строки
    * @param col {natural} номер столбца
    * @return {number}
    */
    get(row, col) {
      return this.data[this.height * col + row];
    }
  /** Установка конкретного элемента матрицы по строке и столбцу
    * @param row  {natural} номер строки
    * @param col  {natural} номер столбца
    * @param value {number} устанавливаемое значение
    * @return {Matrix}
    */
    set(row, col, value) {
      let array = this.data.slice(), h = this.height, w = this.width;
      array[h * col + row] = value;
      return new Matrix(array, h, w);
    }
  /** Замена столбца в матрице на значения из вектора
    * @param index {natural} номер столбца
    * @param vector {Vector} вектор, который станет столбцом
    * @return {Matrix}
    */
    setCol(index, vector) {
      return this.fill(index * this.height, vector.data);
    }
  /** Замена строки в матрице на значения из вектора
    * @param index {natural} номер строки
    * @param vector {Vector} вектор, который станет строкой
    * @return {Matrix}
    */
    setRow(index, vector) {
      return this.transpose().setCol(index, vector).transpose();
    }
  /** Добавление к столбцу матрицы значение из вектора
    * @param index {natural} номер столбца матрицы
    * @param vector {Vector} прибавляемый вектор
    * @return {Matrix}
    */
    additionCol(index, vector) {
      return this.setCol(index, this.col(index).addition(vector));
    }
  /** Добавление к строке матрицы значение из вектора
    * @param index {natural} номер строки матрицы
    * @param vector {Vector} прибавляемый вектор
    * @return {Matrix}
    */
    additionRow(index, vector) {
      return this.transpose().additionCol(index, vector).transpose();
    }
  /** Операция переноса координат
    * @param {vector} вектор переноса (размерностью на 1 меньше размерности матрицы)
    * @return {Matrix}
    */
    translate(vector) {
      return this.multiply(Matrix.translate(vector));
    }
  /** Операция переноса координат по оси X
    * @param coordinate {number} координата переноса
    */
    translateX(coordinate) {
      return this.multiply(Matrix.translateX(coordinate));
    }
  /** Операция переноса координат по оси Y
    * @param coordinate {number} координата переноса
    */
    translateY(coordinate) {
      return this.multiply(Matrix.translateY(coordinate));
    }
  /** Операция переноса координат по оси Z
    * @param coordinate {number} координата переноса
    */
    translateZ(coordinate) {
      return this.multiply(Matrix.translateZ(coordinate));
    }
  /** Операция переноса координат по плоскости Z (перенос по осям X и Y)
    * @param x {number} состовляющая переноса по оси X
    * @param y {number} состовляющая переноса по оси Y
    * @return {Matrix}
    */
    translateXY(x, y) {
      return this.multiply(Matrix.translateXY(x, y));
    }
  /** Операция переноса координат по плоскости Y (перенос по осям X и Z)
    * @param x {number} состовляющая переноса по оси X
    * @param z {number} состовляющая переноса по оси Z
    * @return {Matrix}
    */
    translateXZ(x, z) {
      return this.multiply(Matrix.translateXZ(x, z));
    }
  /** Операция переноса координат по плоскости X (перенос по осям Y и Z)
    * @param y {number} состовляющая переноса по оси Y
    * @param z {number} состовляющая переноса по оси Z
    * @return {Matrix}
    */
    translateYZ(y, z) {
      return this.multiply(Matrix.translateYZ(y, z));
    }
  /** Операция масштабирования координат
    * @param {vector} вектор масштаба (размерностью на 1 меньше размерности матрицы)
    * @return {Matrix}
    */
    scale(vector) {
      return this.multiply(Matrix.scale(vector));
    }
  /** Операция масштабирования координат по оси X
    * @param factor {number} коэффициент масштабирования
    */
    scaleX(factor) {
      return this.multiply(Matrix.scaleX(factor));
    }
  /** Операция масштабирования координат по оси Y
    * @param factor {number} коэффициент масштабирования
    */
    scaleY(coordinate) {
      return this.multiply(Matrix.scaleY(factor));
    }
  /** Операция масштабирования координат по оси Z
    * @param factor {number} коэффициент масштабирования
    */
    scaleZ(factor) {
      return this.multiply(Matrix.scaleZ(factor));
    }
  /** Операция масштабирования координат по осям X, Y, Z на одинаковые значения
    * @param factor {number} коэффициент масштабирования
    */
    scaleXYZ(factor) {
      return this.multiply(Matrix.scaleXYZ(factor));
    }
  /** Операция поворота координат @2d
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    rot(angle) {
      return this.multiply(Matrix.rot(angle));
    }
  /** Операция поворота координат @3d
    * @param {vector} вектор оси поворота (размерностью на 1 меньше размерности матрицы)
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    rotate(vector, angle) {
      return this.multiply(Matrix.rotate(vector, angle));
    }
  /** Операция поворота координат вокруг оси X
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    rotateX(angle) {
      return this.multiply(Matrix.rotateX(angle));
    }
  /** Операция поворота координат вокруг оси Y
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    rotateY(angle) {
      return this.multiply(Matrix.rotateY(angle));
    }
  /** Операция поворота координат вокруг оси Z
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    rotateZ(angle) {
      return this.multiply(Matrix.rotateZ(angle));
    }
  /** Сдвиг квадратной матрицы вниз
    * @return {Matrix}
    */
    shiftDown() {
      return Matrix.shiftDown(this.width).multiply(this);
    }
  /** Сдвиг квадратной матрицы вверх
    * @return {Matrix}
    */
    shiftUp() {
      return Matrix.shiftUp(this.width).multiply(this);
    }
  /** Сдвиг квадратной матрицы влево
    * @return {Matrix}
    */
    shiftLeft() {
      return this.multiply(Matrix.shiftDown(this.width));
    }
  /** Сдвиг квадратной матрицы вправо
    * @return {Matrix}
    */
    shiftRight() {
      return this.multiply(Matrix.shiftUp(this.width));
    }
  /** Сдвиг квадратной матрицы вверх-вправо
    * @return {Matrix}
    */
    shiftUpRight() {
      let shift = Matrix.shiftUp(this.width);
      return shift.multiply(this).multiply(shift);
    }
  /** Сдвиг квадратной матрицы вверх-влево
    * @return {Matrix}
    */
    shiftUpRight() {
      let n = this.width, shift = Matrix.shiftUp(n), unshift = Matrix.shiftDown(n);
      return shift.multiply(this).multiply(unshift);
    }
  /** Сдвиг квадратной матрицы вниз-влево
    * @return {Matrix}
    */
    shiftUpRight() {
      let unshift = Matrix.shiftDown(this.width);
      return unshift.multiply(this).multiply(unshift);
    }
  /** Сдвиг квадратной матрицы вниз-вправо
    * @return {Matrix}
    */
    shiftUpRight() {
      let n = this.width, shift = Matrix.shiftUp(n), unshift = Matrix.shiftDown(n);
      return unshift.multiply(this).multiply(shift);
    }
  /** Операция искажения
    * @param vector {Vector} вектор @2d коэффициентов искажения
    * @return {Matrix}
    */
    skew(vector) {
      let dimension = Math.min(this.width, this.height);
      return this.multiply(Matrix.skew(vector, dimension));
    }
  /** Обратная матрица
    * @return {Matrix}
    */
    inverse() {
      let h = this.height, w = this.width,
      matrix = Matrix.concat(this, Matrix.identity(h));
      matrix = Matrix.gauss(matrix, w).matrix.data.slice(h * w);
      return new Matrix(matrix, h, w);
    }
  /** Обратная матрица к матрице модели для @3d графики
    * @return {Matrix}
    */
    inverse3D() {
      let translate = (new Vector(this.element(12, 3).reverse()));
      return this.minor(3, 3).transpose().resize(4, 4).set(3, 3, 1).translate(translate);
    }
  /** Определитель матрицы
    * @return {number}
    */
    determinant() {
      return Matrix.gauss(this, this.width).determinant;
    }
  /** Ранг матрицы
    * @return {number}
    */
    rank() {
      return Matrix.gauss(this, this.width).rank;
    }
  /** Минор матрицы по строке и столбцу (получаемый минор должен существовать)
    * @param row {natural} номер исключаемой строки
    * @param col {natural} номер исключаемого столбца
    * @return {Matrix}
    */
    minor(row, col) {
      let h = this.height, w = this.width, i = 0, j,
          m = h - 1, n = w - 1, array = new Float32Array(m * n);
      for (; i < w; ++i)
        if (col === i) continue;
        for (j = 0; j < h; ++j)
          if (row === j) continue;
          array[(i - (col < i)) * m + (j - (row < j))] = this.data[i * h + j];
      return new Matrix(array, m, n);
    }
  /** Минор матрицы любого порядка по строкам и столбцам (получаемый минор должен существовать)
    * @param row {Array of natural} номера исключаемых строк
    * @param col {Array of natural} номера исключаемых столбцов
    * @return {Matrix}
    */
    minors(row, col) {
      let h = this.height, w = this.width, i = 0, y = 0, j, x;
      let m = h - row.length, n = w - col.length, array = new Float32Array(m * n);
      for (; i < w; ++i)
        if (col.indexOf(i) > -1) ++y; else
        for (j = 0, x = 0; j < h; ++j)
          if (row.indexOf(j) > -1) ++x; else
          array[(i - y) * m + (j - x)] = this.data[i * h + j];
      return new Matrix(array, m, n);
    }
  /** Решение СЛАУ (методом Гаусса)
    * @param vector {Vector} правая часть системы уравнений Ax = B с матрицей A и вектором B @required
    * @return {Vector} решение СЛАУ
    */
    solve(vector) {
      let w = this.width, n = this.height * w;
      return new Vector(Matrix.gauss(Matrix.concat(this, Matrix.from(vector)), w).matrix.data.slice(n));
    }
  /** @subsection Элементарные преобразования матрицы */
  /** Обмен столбцов матрицы
    * @param a {natural} номер первого перемещаемого столбца
    * @param b {natural} номер второго перемещаемого столбца
    * @return {Matrix}
    */
    swapCol(a, b) {
      let A = this.col(a), B = this.col(b);
      return this.setCol(a, B).setCol(b, A);
    }
  /** Смена местами строк матрицы
    * @param a {natural} номер первой перемещаемой строки
    * @param b {natural} номер второй перемещаемой строки
    * @return {Matrix}
    */
    swapRow(a, b) {
      return this.transpose().swapCol(a, b).transpose();
    }
  /** Умножение столбца матрицы на скаляр
    * @param index {natural} номер столбца
    * @param factor {number} множитель
    * @return {Matrix}
    */
    scaleCol(index, factor) {
      return this.setCol(index, this.col(index).scale(factor));
    }
  /** Умножение строки матрицы на скаляр
    * @param index {natural} номер строки
    * @param factor {number} множитель
    * @return {Matrix}
    */
    scaleRow(index, factor) {
      return this.transpose().scaleCol(index, factor).transpose();
    }
  /** Добавление к столбцу матрицы другого столбца, помноженного на скаляр
    * @param a {natural} номер столбца, к которому будет прибавление
    * @param b {natural} номер прибавляемого столбца
    * @param factor {number} множитель прибавляемого столбца @required
    * @return {Matrix}
    */
    additionCols(a, b, factor = 1) {
      return this.additionCol(a, this.col(b).scale(factor));
    }
  /** Добавление к строке матрицы другой строки, помноженной на скаляр
    * @param a {natural} номер строки, к которой будет прибавление
    * @param b {natural} номер прибавляемой строки
    * @param factor {number} множитель прибавляемой строки @required
    * @return {Matrix}
    */
    additionRows(a, b, factor = 1) {
      return this.transpose().additionCol(a, b, factor).transpose();
    }
  /** @subsection @method @static */
  /** Матрица из набора векторов
    * @arguments {Vector} векторы-столбцы матрицы (размерности должны совпадать)
    * @return {Matrix}
    */
    static from(...vector) {
      let w = vector.length, h = vector[0].dimension, matrix = Matrix.empty(h, w);
      vector.forEach((v, i) => matrix = matrix.fill(i * h, v.data)); // setCol(i, v)
      return matrix;
    }
  /** Блок из матриц @todo
    * @arguments {Matrix} матрицы с одинаковым количествои строк
    * @return {Matrix}
    */
    static concat(...matrix) {
      let h = matrix[0].height, w = matrix.reduce((r, e) => r + e.width, 0),
        array = new Float32Array(h * w), i = 0, shift = 0;
      for (; i < matrix.length; ++i) {
        matrix[i].data.forEach((e, i) => array[shift + i] = e);
        shift += matrix[i].width * h;
      }
      return new Matrix(array, h, w);
    }
  /** Единичная матрица
    * @param dimension {natural} размерность
    * @return {Matrix}
    */
    static identity(dimension) {
      let array = new Float32Array(dimension * dimension), i = 0;
      for (; i < dimension; ++i) array[i * dimension + i] = 1;
      return new Matrix(array, dimension, dimension);
    }
  /** Нулевая (пустая) матрица
    * @param height {natural} количество строк    (высота)
    * @param width  {natural} количество столбцов (ширина)
    * @return {Matrix}
    */
    static empty(height, width = height) {
      let array = new Float32Array(height * width);
      return new Matrix(array, height, width);
    }
  /** Диагональная матрица из вектора
    * @param vector {Vector} элементы главной диагонали
    */
    static diagonal(vector) {
      let n = vector.dimension, array = new Float32Array(n * n);
      vector.data.forEach((e, i) => array[i * n + i] = e);
      return new Matrix(array, n, n);
    }
  /** Над-диагональная матрица (диагональ над главной диагональю)
    * @param vector {Vector} элементы верхней диагонали
    * @return {Matrix}
    */
    static diagonalUp(vector) {
      let n = vector.dimension + 1, array = new Float32Array(n * n);
      vector.data.forEach((e, i) => array[(i + 1) * n + i] = e);
      return new Matrix(array, n, n);
    }
  /** Под-диагональная матрица (диагональ под главной диагональю)
    * @param vector {Vector} элементы нижней диагонали
    * @return {Matrix}
    */
    static diagonalDown(vector) {
      let n = vector.dimension + 1, array = new Float32Array(n * n);
      vector.data.forEach((e, i) => array[i * n + (i + 1)] = e);
      return new Matrix(array, n, n);
    }
  /** Матрица сдвига вверх (верхне-сдвиговая матрица)
    * @param dimension {natural} размерность
    * @return {Matrix}
    */
    static shiftUp(dimension) {
      return Matrix.diagonalUp(Vector.identity(dimension));
    }
  /** Матрица сдвига вниз (нижне-сдвиговая матрица)
    * @param dimension {natural} размерность
    * @return {Matrix}
    */
    static shiftDown(dimension) {
      // return Matrix.shiftUp().transponate();
      return Matrix.diagonalDown(Vector.identity(dimension));
    }
  /** Матрица переноса
    * @param vector {Vector} координаты переноса
    * @return {Matrix} размерность на 1 больше размерности вектора
    */
    static translate(vector) {
      let n = vector.dimension + 1, column = n - 1;
      return Matrix.identity(n).fill(column * n, vector.data);
    }
  /** Матрица переноса по оси X
    * @param coordinate {number} координата переноса
    * @return {Matrix}
    */
    static translateX(coordinate) {
      return Matrix.translate(Vector.X.scale(coordinate));
    }
  /** Матрица переноса по оси Y
    * @param coordinate {number} координата переноса
    * @return {Matrix}
    */
    static translateY(coordinate) {
      return Matrix.translate(Vector.Y.scale(coordinate));
    }
  /** Матрица переноса по оси Z
    * @param coordinate {number} координата переноса
    * @return {Matrix}
    */
    static translateZ(coordinate) {
      return Matrix.translate(Vector.Z.scale(coordinate));
    }
  /** Матрица переноса по плоскости Z (по осям X и Y)
    * @param x {number} координата по оси X
    * @param y {number} координата по оси Y
    * @return {Matrix}
    */
    static translateXY(x, y) {
      return Matrix.translate(new Vector([x, y, 0]));
    }
  /** Матрица переноса по плоскости Y (по осям X и Z)
    * @param x {number} координата по оси X
    * @param z {number} координата по оси Z
    * @return {Matrix}
    */
    static translateXZ(x, z) {
      return Matrix.translate(new Vector([x, 0, z]));
    }
  /** Матрица переноса по плоскости X (по осям Y и Z)
    * @param y {number} координата по оси Y
    * @param z {number} координата по оси Z
    * @return {Matrix}
    */
    static translateYZ(y, z) {
      return Matrix.translate(new Vector([0, y, z]));
    }
  /** Матрица масштабирования
    * @param {Vector} коэффициенты масштабирования
    * @return {Matrix} матрица размерностю на 1 большей размерности вектора
    */
    static scale(vector) {
      let n = vector.dimension;
      return Matrix.diagonal(vector.resize(n + 1).fill(n, 1));
    }
  /** Матрица масштабирования по оси X
    * @param factor {number} коэффициент масштабирования
    * @return {Matrix}
    */
    static scaleX(factor) {
      return Matrix.scale(new Vector([factor, 1, 1]));
    }
  /** Матрица масштабирования по оси Y
    * @param factor {number} коэффициент масштабирования
    * @return {Matrix}
    */
    static scaleY(factor) {
      return Matrix.scale(new Vector([1, factor, 1]));
    }
  /** Матрица масштабирования по оси Z
    * @param factor {number} коэффициент масштабирования
    * @return {Matrix}
    */
    static scaleZ(factor) {
      return Matrix.scale(new Vector([1, 1, factor]));
    }
  /** Матрица масштабирования по осям X, Y, Z на одинаковые значения
    * @param factor {number} коэффициент масштабирования
    * @return {Matrix}
    */
    scaleXYZ(factor) {
      return Matrix.scale(new Vector([factor, factor, factor]));
    }
  /** Матрица абсолютного поворота @2d
    * @param angle  {number} угол поворота
    * @return {Matrix}
    */
    static rot(angle) {
      let sin = Math.sin(angle), cos = Math.cos(angle);
      return new Matrix([cos, sin, 0, -sin, cos, 0, 0, 0, 1], 3, 3);
    }
  /** Матрица абсолютного поворота вокруг вектора @3d
    * @param vector {Vector} ось поворота в трёхмерных координатах
    * @param angle  {number} угол поворота
    * @return {Matrix}
    */
    static rotate(vector, angle) {
      let q = Quatern.from(angle, vector),
        xx = q.x * q.x, xy = q.x * q.y, xz = q.x * q.z, xw = q.x * q.w,
        yy = q.y * q.y, yz = q.y * q.z, yw = q.y * q.w,
        zz = q.z * q.z, zw = q.z * q.w, ww = q.w * q.w,
          a = Vector.from(1 - 2 * (yy + zz),     2 * (xy + zw),     2 * (xz - yw)),
          b = Vector.from(    2 * (xy - zw), 1 - 2 * (xx + zz),     2 * (yz + xw)),
          c = Vector.from(    2 * (xz + yw),     2 * (yz - xw), 1 - 2 * (xx + yy));
      return  Matrix.from(a, b, c).resize(4, 4).set(3, 3, 1);
    }
  /** Матрица абсолютного поворота вокруг оси X @3d
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    static rotateX(angle) {
      return Matrix.rotate(Vector.X, angle);
    }
  /** Матрица абсолютного поворота вокруг оси Y @3d
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    static rotateY(angle) {
      return Matrix.rotate(Vector.Y, angle);
    }
  /** Матрица абсолютного поворота вокруг оси Z @3d
    * @param angle {number} угол поворота
    * @return {Matrix}
    */
    static rotateZ(angle) {
      return Matrix.rotate(Vector.Z, angle);
    }
  /** Матрица искажения
    * @param vector {Vector} двумерный вектор коэффициентов искажения
    * @param dimension {Number} размерность матрицы
    * @return {Matrix}
    */
    static skew(vector, dimension = 2) {
      return Matrix.identity(dimension).set(1, 0, vector.x).set(0, 1, vector.y);
    }
  /** Матрица пирамидального отсечения (перспективной проекции)
    * 
    */
    static frustum(top, right, bottom, left, near, far) {
      let a = right - left, b = top - bottom, c = far - near,
          d = right + left, e = top + bottom, f = far + near,
          M = Matrix.diagonal(Vector.from(2 * near / a, 2 * near / b, -f / c, 0));
      M = M.fill(8, new Float32Array([d / a, e / b]));
      M = M.set(3, 2, -1).set(2, 3, -2 * far * near / c);
      return M;
    }
  /** Матрица прямоугольного отсечения (параллельной проекции)
    * 
    */
    static ortho(top, right, bottom, left, near, far) {
      let a = right - left, b = top - bottom, c = far - near,
          d = right + left, e = top + bottom, f = far + near;
      return Matrix.diagonal(Vector.from(2 / a, 2 / b, -2 / c, 1)).fill(12, [-d / a, -e / b, -f / c]);
    }
  /** Матрица перспективной проекции */
    static perspective(fovy, aspect, near, far) {
      aspect *= (fovy = near * Math.tan(fovy * Math.PI / 360));
      return Matrix.frustum(fovy, aspect, -fovy, -aspect, near, far);
    }
  /** Матрица вида */
    static lookAt(eye, center, up) {
      let f = center.difference(eye).normalize(),
          s = f.multiply(up).normalize(),
          u = s.multiply(f);
      f = f.reverse();
      return Matrix.from(s, u, f).transpose().resize(4, 4).set(3, 3, 1).translate(eye.reverse());
    }
  /** Применение метода Гаусса
    * @param vector {Vector} правая часть системы уравнений Ax = B с матрицей A и вектором B @required
    * @return {Object#MatrixData}
    */
    static gauss(matrix, w) {
      let h = matrix.height, swap = 0, i = 0, j = 0, determinant = 1, history = [], k, column;
      matrix = matrix.transpose();
      for (; i < w; ++i) {
        column = matrix.row(i); // re transpose
        if (column.empty()) continue;
        if (column.data[j] === 0) // swap(row[j], row[k])
          for (k = j + 1; k < h; ++k)
            if (column[k] !== 0) {
              matrix = matrix.swapCol(j, k);
              swap(column, j, k);
              ++swap; // число перестановок строк
              history.push(['swap', j, k]);
              break;
            }
        determinant *= column.data[j];
        if (column.data[j] === 0) continue; // --rank
        if (column.data[j] !== 1) { // row[j] /= M[j, i]
          matrix = matrix.scaleCol(j, 1 / column.data[j]);
          history.push(['rescale', j, column.data[j]]);
        }
        for (k = 0; k < h; ++k) { // зануление остальных элементов i-го столбца (row[k] -= row[j] * M[k, i])
          if (k === j || column.data[k] === 0) continue;
          matrix = matrix.additionCols(k, j, -column.data[k]);
          history.push(['addition', k, j, column.data[k]]);
        }
        ++j;
      }
      return {
        determinant: swap % 2 ? -determinant : determinant,
        history    : history,
        matrix     : matrix.transpose(),
        width      : w,
        swap       : swap,
        rank       : j
      }
    }
  }

/** @section Export */
  window.Vector  = Vector;
  window.Quatern = Quatern;
  window.Matrix  = Matrix;

/** @section common */
  function isZero(e) { return e === 0 }
  function isUnit(e) { return e === 1 }
  function square(previous, current) {
    return previous + Math.pow(current, 2);
  }
  function swap(array, i, j) {
    let t =    array[a];
    array[a] = array[b];
    array[b] = t;
    // return array;
  }
  const vectorIndex = 'xyzw';
})(window, document);
