/**
 * ============================================
 * SEEDER COMPLETO - DATOS DE PRUEBA
 * ============================================
 * Script para poblar la base de datos con datos de prueba completos
 * 
 * Crea:
 * - 1 Administrador
 * - 1 Auxiliar
 * - 5 Clientes
 * - 5 Categorías
 * - 15 Subcategorías (3 por categoría)
 * - 75 Productos (5 por subcategoría)
 */

const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Función principal del seeder
 */
const seedDatosCompletos = async () => {
  try {
    console.log('\n🌱 ========================================');
    console.log('   INICIANDO SEEDER DE DATOS COMPLETOS');
    console.log('========================================\n');

    // ==========================================
    // 1. CREAR USUARIOS
    // ==========================================
    console.log('👥 1. CREANDO USUARIOS...\n');

    // ADMINISTRADOR
    const adminExistente = await Usuario.findOne({ where: { email: 'admin@ecommerce.com' } });
    if (!adminExistente) {
      await Usuario.create({
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@ecommerce.com',
        password: 'admin1234',
        rol: 'administrador',
        telefono: '3001234567',
        direccion: 'SENA - Oficina Principal',
        activo: true
      });
      console.log('✅ Administrador creado');
      console.log('   📧 Usuario: admin@ecommerce.com');
      console.log('   🔑 Password: admin1234\n');
    } else {
      console.log('✅ Administrador ya existe\n');
    }

    // AUXILIAR
    const auxiliarExistente = await Usuario.findOne({ where: { email: 'auxiliar@ecommerce.com' } });
    if (!auxiliarExistente) {
      await Usuario.create({
        nombre: 'Auxiliar',
        apellido: 'Soporte',
        email: 'auxiliar@ecommerce.com',
        password: 'aux123',
        rol: 'auxiliar',
        telefono: '3009876543',
        direccion: 'SENA - Oficina Auxiliar',
        activo: true
      });
      console.log('✅ Auxiliar creado');
      console.log('   📧 Usuario: auxiliar@ecommerce.com');
      console.log('   🔑 Password: aux123\n');
    } else {
      console.log('✅ Auxiliar ya existe\n');
    }

    // CLIENTES (5)
    console.log('👤 Creando 5 clientes...');
    for (let i = 1; i <= 5; i++) {
      const clienteExistente = await Usuario.findOne({ where: { email: `cliente${i}@ecommerce.com` } });
      if (!clienteExistente) {
        await Usuario.create({
          nombre: `Cliente ${i}`,
          apellido: `Apellido ${i}`,
          email: `cliente${i}@ecommerce.com`,
          password: `cliente${i}`,
          rol: 'cliente',
          telefono: `300${1000000 + i}`,
          direccion: `Dirección del Cliente ${i}, Bogotá`,
          activo: true
        });
        console.log(`   ✅ Cliente ${i} - Email: cliente${i}@ecommerce.com - Pass: cliente${i}`);
      }
    }
    
    const usuariosCreados = await Usuario.count();
    console.log(`\n✅ Total: ${usuariosCreados} usuarios en la base de datos\n`);

    // ==========================================
    // 2. CREAR CATEGORÍAS
    // ==========================================
    console.log('📁 2. CREANDO CATEGORÍAS...\n');

    const categoriasExistentes = await Categoria.count();
    
    if (categoriasExistentes > 0) {
      console.log('⚠️  Ya existen categorías en la base de datos.\n');
    } else {
      const categoriasData = [
        {
          nombre: 'Electrónica',
          descripcion: 'Productos electrónicos y tecnología de última generación'
        },
        {
          nombre: 'Ropa',
          descripcion: 'Moda y vestimenta para toda la familia'
        },
        {
          nombre: 'Hogar',
          descripcion: 'Artículos para el hogar y decoración'
        },
        {
          nombre: 'Deportes',
          descripcion: 'Equipamiento deportivo y fitness'
        },
        {
          nombre: 'Libros',
          descripcion: 'Libros, revistas y material de lectura'
        }
      ];

      const categorias = [];
      for (const catData of categoriasData) {
        const categoria = await Categoria.create(catData);
        categorias.push(categoria);
        console.log(`   ✅ ${categoria.nombre}`);
      }
      console.log('\n✅ Total: 5 categorías creadas\n');

      // ==========================================
      // 3. CREAR SUBCATEGORÍAS (3 por categoría)
      // ==========================================
      console.log('📂 3. CREANDO SUBCATEGORÍAS...\n');

      const subcategoriasData = {
        'Electrónica': [
          { nombre: 'Computadoras', descripcion: 'Laptops, PCs y accesorios' },
          { nombre: 'Celulares', descripcion: 'Smartphones y tablets' },
          { nombre: 'Audio', descripcion: 'Audífonos, parlantes y equipos de sonido' }
        ],
        'Ropa': [
          { nombre: 'Hombre', descripcion: 'Ropa para caballero' },
          { nombre: 'Mujer', descripcion: 'Ropa para dama' },
          { nombre: 'Niños', descripcion: 'Ropa infantil' }
        ],
        'Hogar': [
          { nombre: 'Cocina', descripcion: 'Utensilios y electrodomésticos de cocina' },
          { nombre: 'Decoración', descripcion: 'Artículos decorativos' },
          { nombre: 'Muebles', descripcion: 'Muebles para el hogar' }
        ],
        'Deportes': [
          { nombre: 'Fitness', descripcion: 'Equipos de gimnasio y ejercicio' },
          { nombre: 'Fútbol', descripcion: 'Artículos de fútbol' },
          { nombre: 'Ciclismo', descripcion: 'Bicicletas y accesorios' }
        ],
        'Libros': [
          { nombre: 'Ficción', descripcion: 'Novelas y cuentos' },
          { nombre: 'Educación', descripcion: 'Libros educativos y académicos' },
          { nombre: 'Infantil', descripcion: 'Libros para niños' }
        ]
      };

      const subcategorias = [];
      for (const categoria of categorias) {
        console.log(`📁 ${categoria.nombre}:`);
        const subsData = subcategoriasData[categoria.nombre];
        
        for (const subData of subsData) {
          const subcategoria = await Subcategoria.create({
            nombre: subData.nombre,
            descripcion: subData.descripcion,
            categoriaId: categoria.id,
            activo: true
          });
          subcategorias.push(subcategoria);
          console.log(`   ✅ ${subcategoria.nombre}`);
        }
        console.log('');
      }
      console.log('✅ Total: 15 subcategorías creadas\n');

      // ==========================================
      // 4. CREAR PRODUCTOS (5 por subcategoría)
      // ==========================================
      console.log('📦 4. CREANDO PRODUCTOS...\n');

      const productosData = {
        // ELECTRÓNICA - Computadoras
        'Computadoras': [
          { nombre: 'Laptop HP Pavilion', descripcion: 'Intel i5, 8GB RAM, 256GB SSD', precio: 1200000, stock: 15 },
          { nombre: 'Laptop Dell Inspiron', descripcion: 'AMD Ryzen 5, 16GB RAM, 512GB SSD', precio: 1500000, stock: 10 },
          { nombre: 'PC Gaming Asus', descripcion: 'Intel i7, 16GB RAM, RTX 3060', precio: 2500000, stock: 8 },
          { nombre: 'MacBook Air M1', descripcion: 'Chip M1, 8GB RAM, 256GB SSD', precio: 3500000, stock: 5 },
          { nombre: 'Laptop Lenovo ThinkPad', descripcion: 'Intel i7, 16GB RAM, 512GB SSD', precio: 1800000, stock: 12 }
        ],
        // ELECTRÓNICA - Celulares
        'Celulares': [
          { nombre: 'iPhone 13', descripcion: '128GB, Pantalla 6.1"', precio: 2800000, stock: 20 },
          { nombre: 'Samsung Galaxy S21', descripcion: '256GB, Pantalla 6.2"', precio: 2200000, stock: 25 },
          { nombre: 'Xiaomi Redmi Note 11', descripcion: '128GB, Pantalla 6.43"', precio: 800000, stock: 30 },
          { nombre: 'Motorola Edge 30', descripcion: '256GB, Pantalla 6.5"', precio: 1500000, stock: 18 },
          { nombre: 'Google Pixel 6', descripcion: '128GB, Pantalla 6.4"', precio: 2000000, stock: 15 }
        ],
        // ELECTRÓNICA - Audio
        'Audio': [
          { nombre: 'Audífonos Sony WH-1000XM4', descripcion: 'Bluetooth, Cancelación de ruido', precio: 800000, stock: 25 },
          { nombre: 'Parlante JBL Flip 5', descripcion: 'Bluetooth portátil, resistente al agua', precio: 300000, stock: 35 },
          { nombre: 'Audífonos AirPods Pro', descripcion: 'Bluetooth, cancelación activa de ruido', precio: 900000, stock: 20 },
          { nombre: 'Barra de sonido Samsung', descripcion: '2.1 canales, 200W', precio: 600000, stock: 12 },
          { nombre: 'Audífonos Gamer Razer', descripcion: 'RGB, sonido 7.1, micrófono', precio: 400000, stock: 18 }
        ],
        // ROPA - Hombre
        'Hombre': [
          { nombre: 'Camisa Formal Blanca', descripcion: 'Algodón, talla M', precio: 80000, stock: 50 },
          { nombre: 'Jean Levi\'s 501', descripcion: 'Denim azul, talla 32', precio: 150000, stock: 40 },
          { nombre: 'Chaqueta de Cuero', descripcion: 'Cuero genuino, talla L', precio: 350000, stock: 15 },
          { nombre: 'Zapatos Deportivos Nike', descripcion: 'Air Max, talla 42', precio: 280000, stock: 30 },
          { nombre: 'Camiseta Polo', descripcion: 'Algodón, varios colores, talla M', precio: 60000, stock: 60 }
        ],
        // ROPA - Mujer
        'Mujer': [
          { nombre: 'Vestido Floral', descripcion: 'Algodón, talla M, varios colores', precio: 120000, stock: 35 },
          { nombre: 'Blusa de Seda', descripcion: 'Seda natural, talla S', precio: 150000, stock: 25 },
          { nombre: 'Pantalón de Yoga', descripcion: 'Lycra, talla M', precio: 80000, stock: 45 },
          { nombre: 'Chaqueta Acolchada', descripcion: 'Impermeable, talla L', precio: 200000, stock: 20 },
          { nombre: 'Zapatos de Tacón', descripcion: 'Cuero, talla 37', precio: 180000, stock: 28 }
        ],
        // ROPA - Niños
        'Niños': [
          { nombre: 'Conjunto Deportivo', descripcion: 'Sudadera y pantalón, 8 años', precio: 70000, stock: 40 },
          { nombre: 'Vestido de Niña', descripcion: 'Algodón, 6 años, varios colores', precio: 65000, stock: 35 },
          { nombre: 'Jeans Infantil', descripcion: 'Denim elástico, 10 años', precio: 55000, stock: 50 },
          { nombre: 'Chaqueta Escolar', descripcion: 'Poliéster, 12 años', precio: 85000, stock: 30 },
          { nombre: 'Zapatos Escolares', descripcion: 'Cuero, talla 32', precio: 90000, stock: 45 }
        ],
        // HOGAR - Cocina
        'Cocina': [
          { nombre: 'Juego de Ollas', descripcion: '10 piezas, acero inoxidable', precio: 250000, stock: 20 },
          { nombre: 'Licuadora Oster', descripcion: '600W, 3 velocidades', precio: 180000, stock: 25 },
          { nombre: 'Cafetera Express', descripcion: 'Espresso 15 bares', precio: 350000, stock: 15 },
          { nombre: 'Microondas Samsung', descripcion: '23L, 800W', precio: 300000, stock: 18 },
          { nombre: 'Set de Cuchillos', descripcion: '6 piezas, acero alemán', precio: 120000, stock: 30 }
        ],
        // HOGAR - Decoración
        'Decoración': [
          { nombre: 'Lámpara de Mesa', descripcion: 'LED, diseño moderno', precio: 80000, stock: 35 },
          { nombre: 'Espejo Decorativo', descripcion: '60x80cm, marco dorado', precio: 150000, stock: 20 },
          { nombre: 'Cuadro Canvas', descripcion: '70x50cm, arte abstracto', precio: 100000, stock: 25 },
          { nombre: 'Florero de Cerámica', descripcion: '30cm altura, varios colores', precio: 45000, stock: 40 },
          { nombre: 'Reloj de Pared', descripcion: 'Silencioso, 40cm diámetro', precio: 70000, stock: 30 }
        ],
        // HOGAR - Muebles
        'Muebles': [
          { nombre: 'Sofá Moderno 3 Puestos', descripcion: 'Tela gris, 200x85x90cm', precio: 1200000, stock: 8 },
          { nombre: 'Mesa de Centro', descripcion: 'Madera y vidrio, 100x60cm', precio: 350000, stock: 12 },
          { nombre: 'Silla de Comedor', descripcion: 'Madera y tapizado, set x4', precio: 600000, stock: 15 },
          { nombre: 'Estantería Modular', descripcion: '5 niveles, 180x80cm', precio: 450000, stock: 10 },
          { nombre: 'Cama Queen Size', descripcion: 'Base y cabecero, 160x190cm', precio: 900000, stock: 6 }
        ],
        // DEPORTES - Fitness
        'Fitness': [
          { nombre: 'Pesas Ajustables', descripcion: 'Set 2.5kg a 25kg', precio: 450000, stock: 15 },
          { nombre: 'Bicicleta Estática', descripcion: 'Resistencia ajustable', precio: 800000, stock: 8 },
          { nombre: 'Colchoneta de Yoga', descripcion: '6mm espesor, antideslizante', precio: 80000, stock: 40 },
          { nombre: 'Caminadora Eléctrica', descripcion: 'Motor 2.5HP, plegable', precio: 1500000, stock: 5 },
          { nombre: 'Banda Elástica Set', descripcion: '5 resistencias diferentes', precio: 60000, stock: 50 }
        ],
        // DEPORTES - Fútbol
        'Fútbol': [
          { nombre: 'Balón Nike Profesional', descripcion: 'Talla 5, certificado FIFA', precio: 150000, stock: 30 },
          { nombre: 'Guayos Adidas Predator', descripcion: 'Talla 42, suela FG', precio: 320000, stock: 25 },
          { nombre: 'Canilleras Nike', descripcion: 'Talla M, con tobilleras', precio: 45000, stock: 40 },
          { nombre: 'Camiseta de Fútbol', descripcion: 'Réplica oficial, talla M', precio: 80000, stock: 35 },
          { nombre: 'Red de Arco', descripcion: '7.32x2.44m, nylon resistente', precio: 200000, stock: 10 }
        ],
        // DEPORTES - Ciclismo
        'Ciclismo': [
          { nombre: 'Bicicleta de Ruta', descripcion: '21 velocidades, aluminio', precio: 1800000, stock: 10 },
          { nombre: 'Casco de Ciclismo', descripcion: 'Ventilado, ajustable', precio: 120000, stock: 25 },
          { nombre: 'Kit de Herramientas', descripcion: '15 piezas, multiusos', precio: 80000, stock: 30 },
          { nombre: 'Luces LED Bicicleta', descripcion: 'Delantera y trasera, recargables', precio: 60000, stock: 35 },
          { nombre: 'Bomba de Aire Portátil', descripcion: 'Con manómetro, 120 PSI', precio: 45000, stock: 40 }
        ],
        // LIBROS - Ficción
        'Ficción': [
          { nombre: 'Cien Años de Soledad', descripcion: 'Gabriel García Márquez', precio: 45000, stock: 50 },
          { nombre: 'El Código Da Vinci', descripcion: 'Dan Brown', precio: 40000, stock: 45 },
          { nombre: 'Harry Potter Colección', descripcion: '7 libros, tapa dura', precio: 350000, stock: 15 },
          { nombre: '1984', descripcion: 'George Orwell', precio: 35000, stock: 60 },
          { nombre: 'El Hobbit', descripcion: 'J.R.R. Tolkien', precio: 42000, stock: 55 }
        ],
        // LIBROS - Educación
        'Educación': [
          { nombre: 'Cálculo: Una Variable', descripcion: 'James Stewart, 8va edición', precio: 120000, stock: 30 },
          { nombre: 'Química General', descripcion: 'Raymond Chang, 11va edición', precio: 110000, stock: 25 },
          { nombre: 'Fundamentos de Programación', descripcion: 'Luis Joyanes Aguilar', precio: 85000, stock: 35 },
          { nombre: 'Atlas de Anatomía Humana', descripcion: 'Frank H. Netter', precio: 180000, stock: 20 },
          { nombre: 'Historia Universal', descripcion: 'Enciclopedia completa', precio: 200000, stock: 15 }
        ],
        // LIBROS - Infantil
        'Infantil': [
          { nombre: 'El Principito', descripcion: 'Antoine de Saint-Exupéry, ilustrado', precio: 35000, stock: 70 },
          { nombre: 'Cuentos de Buenas Noches', descripcion: 'Colección 20 cuentos', precio: 50000, stock: 60 },
          { nombre: 'Aprende a Leer Jugando', descripcion: 'Libro interactivo 5-7 años', precio: 45000, stock: 55 },
          { nombre: 'Enciclopedia Visual Niños', descripcion: 'Tapa dura, ilustraciones', precio: 90000, stock: 30 },
          { nombre: 'La Oruga Muy Hambrienta', descripcion: 'Eric Carle, pop-up', precio: 40000, stock: 65 }
        ]
      };

      let totalProductos = 0;
      
      for (const subcategoria of subcategorias) {
        const productos = productosData[subcategoria.nombre];
        
        if (productos) {
          console.log(`📦 ${subcategoria.nombre} (${subcategoria.categoria?.nombre || 'Sin categoría'}):`);
          
          for (const prodData of productos) {
            await Producto.create({
              nombre: prodData.nombre,
              descripcion: prodData.descripcion,
              precio: prodData.precio,
              stock: prodData.stock,
              categoriaId: subcategoria.categoriaId,
              subcategoriaId: subcategoria.id,
              imagen: 'producto-default.jpg', // Imagen por defecto
              activo: true
            });
            console.log(`   ✅ ${prodData.nombre} - $${prodData.precio.toLocaleString()}`);
            totalProductos++;
          }
          console.log('');
        }
      }
      
      console.log(`✅ Total: ${totalProductos} productos creados\n`);
    }

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n🎉 ========================================');
    console.log('   SEEDER COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');

    const totalUsuarios = await Usuario.count();
    const totalCategorias = await Categoria.count();
    const totalSubcategorias = await Subcategoria.count();
    const totalProductos = await Producto.count();

    console.log('📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${totalUsuarios}`);
    console.log(`   📁 Categorías: ${totalCategorias}`);
    console.log(`   📂 Subcategorías: ${totalSubcategorias}`);
    console.log(`   📦 Productos: ${totalProductos}\n`);

    console.log('🔑 CREDENCIALES DE ACCESO:\n');
    console.log('   👨‍💼 ADMINISTRADOR');
    console.log('      Email: admin@ecommerce.com');
    console.log('      Password: admin1234\n');
    console.log('   👤 AUXILIAR');
    console.log('      Email: auxiliar@ecommerce.com');
    console.log('      Password: aux123\n');
    console.log('   🛍️  CLIENTES (5)');
    console.log('      Email: cliente1@ecommerce.com - Password: cliente1');
    console.log('      Email: cliente2@ecommerce.com - Password: cliente2');
    console.log('      Email: cliente3@ecommerce.com - Password: cliente3');
    console.log('      Email: cliente4@ecommerce.com - Password: cliente4');
    console.log('      Email: cliente5@ecommerce.com - Password: cliente5\n');

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en el seeder:', error.message);
    console.error(error);
    throw error;
  }
};

module.exports = { seedDatosCompletos };
