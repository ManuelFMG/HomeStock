# HomeStock

**HomeStock** es una aplicación web para organizar el inventario del hogar: permite conocer qué hay en cada ubicación, registrar aperturas, vigilar caducidades y mantener la lista de la compra conectada con el inventario.

Está pensada para reducir compras duplicadas, evitar desperdicio y conservar un historial claro de los cambios realizados en cada hogar.

## Qué permite hacer hoy

### Inventario por ubicaciones

- Crear, editar y eliminar productos.
- Organizar productos por ubicaciones del hogar, como nevera, congelador, despensa o mueble de limpieza.
- Registrar cantidad, precio, unidad, categoría, caducidad y duración tras apertura.
- Consultar el valor agregado del inventario.

### Gestión lot-aware

HomeStock distingue entre el producto lógico y su stock físico cuando un artículo tiene varios lotes.

- Añadir compras de un producto existente sin crear tarjetas duplicadas.
- Consultar los lotes asociados, sus cantidades y sus fechas de caducidad.
- Registrar aperturas parciales de un lote.
- Deshacer aperturas y reconstruir el stock correctamente.
- Consumir unidades mediante `−` respetando la prioridad de consumo definida por los lotes.
- Marcar un producto como agotado y reactivarlo.
- Diferenciar entre un agotado manual, cuyo stock físico puede restaurarse, y el agotado tras consumir realmente la última unidad.
- Mantener coherentes la cantidad agregada, los lotes, el historial y la lista de la compra.

### Lista de la compra

- Crear y editar artículos de compra por ubicación.
- Detectar posibles duplicados.
- Añadir productos agotados a la lista de la compra.
- Transferir compras al inventario.
- Cuando procede, la transferencia añade un lote físico nuevo al producto existente.
- Mantener separadas las entradas manuales de las creadas desde el flujo de agotado.

### Dashboard, historial y estadísticas

- Dashboard con resumen de productos, unidades y valor del inventario.
- Avisos de productos agotados, caducados, que caducan hoy o próximamente, y productos abiertos.
- Avisos de invitaciones pendientes.
- Historial de movimientos de inventario.
- Estadísticas y resúmenes del hogar.

### Hogares compartidos

- Crear y seleccionar hogares.
- Invitar a otras personas por correo electrónico.
- Aceptar o rechazar invitaciones.
- Consultar y gestionar miembros del hogar.
- Abandonar un hogar compartido cuando corresponda.

### Autenticación

- Registro e inicio de sesión mediante Firebase Authentication.
- Protección de rutas privadas.
- Redirección correcta entre rutas públicas y privadas.
- Carga diferida de páginas para reducir el JavaScript inicial.

## Tecnologías

- React 19
- Vite 8
- React Router 7
- Material UI y Emotion
- Firebase Authentication
- Cloud Firestore
- Oxlint

## Arquitectura

```text
src/
├── components/     # Interfaz reutilizable y vistas de dominio
├── context/        # Estado de autenticación, hogar y avisos
├── firebase/       # Inicialización del SDK web de Firebase
├── hooks/          # Acceso al estado compartido
├── models/         # Modelos y constantes de inventario y hogar
├── pages/          # Pantallas de la aplicación
├── routes/         # Rutas, guards y carga diferida
├── services/       # Persistencia y lógica de dominio con Firestore
├── theme/          # Tema visual de Material UI
└── utils/          # Utilidades de inicialización y validación
```

La lógica de lotes se concentra principalmente en `src/services/inventoryLotService.js`. Las operaciones de agotado, reactivación y transferencia desde Shopping se coordinan desde `src/services/productStatusService.js`.

## Instalación y ejecución local

### Requisitos

- Node.js compatible con Vite 8. Se recomienda Node.js 20.19 o superior.
- Un proyecto de Firebase con Authentication y Cloud Firestore habilitados.

### Pasos

```bash
git clone https://github.com/ManuelFMG/HomeStock.git
cd HomeStock
npm install
npm run dev
```

El script de desarrollo abre la aplicación en el navegador.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia Vite en desarrollo y abre el navegador. |
| `npm run build` | Genera la compilación de producción en `dist/`. |
| `npm run preview` | Sirve localmente la compilación de producción. |
| `npm run lint` | Ejecuta Oxlint. |

## Configuración de Firebase

HomeStock utiliza el SDK web de Firebase en `src/firebase/firebase.js`. Para ejecutar tu propia instancia:

1. Crea un proyecto en Firebase.
2. Habilita Firebase Authentication con los proveedores que vayas a usar.
3. Crea una base de datos de Cloud Firestore y configura sus reglas de seguridad.
4. Registra una aplicación web y sustituye la configuración cliente de `src/firebase/firebase.js` por la de tu proyecto.

La configuración web cliente de Firebase identifica una aplicación pública; no debe contener claves privadas, cuentas de servicio ni credenciales de administrador. Las reglas de Firebase son las que deben proteger el acceso a los datos.

Los archivos `.env` están ignorados por Git. Si en el futuro se migra la configuración cliente a variables de entorno, debe mantenerse un archivo `.env.example` sin valores reales.

## Estado del proyecto

La gestión CRUD lot-aware del inventario, Shopping, agotado/reactivación, hogares compartidos, historial, estadísticas, autenticación y la carga diferida de rutas están implementados y validados.

La auditoría de dependencias no presenta vulnerabilidades conocidas y el lint está limpio.

## Próximo hito

- Integración de etiquetas NFC para identificar o acceder rápidamente a productos, pendiente de definición funcional y técnica.

## Autor

**Manuel Mateo**

- GitHub: [ManuelFMG](https://github.com/ManuelFMG)

