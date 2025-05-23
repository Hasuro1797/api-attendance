# API de Asistencia y Control de Acceso

## Índice

- [Descripción](#descripción)
- [Funcionalidades Principales](#funcionalidades-principales)
- [Instalación](#instalación)
  - [Clonar Repositorio](#clonar-repositorio)
  - [Variables de Entorno](#variables-de-entorno)
  - [Ejecutar Código](#ejecutar-código)
  - [Conexión a Base de Datos](#conexión-a-base-de-datos)
- [Documentación de Endpoints](#documentación-de-endpoints)
  - [Autenticación](#autenticación)
  - [Asistencia](#asistencia)
  - [Redes](#redes)
  - [Usuarios](#usuarios)
  - [Configuración](#configuración)
  - [Endpoints de documentación](#endpoints-de-documentación)

## Descripción

API REST desarrollada con NestJS para el control de asistencia y acceso. La API permite registrar asistencias, gestionar usuarios, configurar reglas de red y autenticar usuarios de manera segura.

## Funcionalidades Principales

- Registro y seguimiento de asistencia
- Autenticación segura con JWT
- Gestión de usuarios y roles
- Configuración de reglas de red
- Control de modalidad (presencial/online) basado en IP
- Documentación Swagger/UI integrada

## Instalación

### Clonar Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/Hasuro1797/api-attendance.git

cd api-attendance
```

### Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=3000

# Base de datos
DATABASE_URL="postgresql://[your_username]:[your_password]@localhost:5432/[your_database_name]?schema=public"

# JWT
JWT_SECRET=your_jwt_secret
```

### Ejecutar Código

```bash
# Instalar dependencias
npm install

# Iniciar la aplicación
npm run start:dev
```

#### Conexion a la base de datos

Para migrar la base de datos y realizar un pull con Prisma, ejecuta los siguientes comandos:

```bash
npx prisma migrate dev --name init
npx prisma db pull
```

## Documentación de Endpoints

### Autenticación

#### POST /auth/signIn

- **Descripción**: Iniciar sesión y obtener token JWT
- **Permisos**: Público
- **Encabezados**:
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    email: string,
    password: string
  }
  ```

#### POST /auth/signOut

- **Descripción**: Cerrar sesión
- **Permisos**: ADMIN, USER
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Respuesta**: 200 OK

#### POST /auth/signup

- **Descripción**: Registrar admin
- **Permisos**: Público
- **Encabezados**:
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    email: string,
    password: string,
    role: string,
    name: string,
    lastName: string,
    phone?: string // Opcional
    department: string
  }
  ```

### Asistencia

#### POST /attendance/checkin

- **Descripción**: Registrar entrada
- **Permisos**: ADMIN, USER
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    checkIn: string; // Formato: HH:mm:ss
  }
  ```
- **Respuesta**: 201 Created

#### POST /attendance/checkout

- **Descripción**: Registrar salida
- **Permisos**: ADMIN, USER
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    checkOut: string; // Formato: HH:mm:ss
  }
  ```
- **Respuesta**: 201 Created

#### GET /attendance/users

- **Descripción**: Listar asistencias de todos los usuarios
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Query**:
  - `page`: Número de página (opcional) por defecto 1
  - `limit`: Cantidad de resultados por página (opcional) por defecto 10
  - `search`: Búsqueda por nombre o apellido del usuario(opcional)
  - `sort`: Ordenamiento (opcional)
  - `filters  `: Filtros(opcional)
    - `currentWeek`: Semana actual(opcional)
    - `currentDay`: Dia actual(opcional
    - `daysAgo`: Dias atrás(opcional)
      Nota: Los filtros son mutuamente excluyentes

#### GET /attendance/user

- **Descripción**: Listar asistencias de un usuario
- **Permisos**: ADMIN, USER
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Query**:
  - `page`: Número de página (opcional) por defecto 1
  - `limit`: Cantidad de resultados por página (opcional) por defecto 10
  - `search`: Búsqueda por nombre o apellido del usuario(opcional)
  - `sort`: Ordenamiento (opcional)
  - `filters  `: Filtros(opcional)
    - `currentWeek`: Semana actual(opcional)
    - `currentDay`: Dia actual(opcional
    - `daysAgo`: Dias atrás(opcional)
      Nota: Los filtros son mutuamente excluyentes

#### GET /attendance/dashboard

- **Descripción**: Obtener información del usuario
- **Permisos**: ADMIN, USER
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)

### Redes

#### GET /networkrule

- **Descripción**: Obtener reglas de red
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)

#### POST /networkrule

- **Descripción**: Crear nueva regla de red
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    name: string,
    ipStart: string,
    ipEnd: string,
    modality: string // PRESENTIAL o REMOTE
  }
  ```
- **Respuesta**: 201 Created

#### PATCH /networkrule/:id

- **Descripción**: Actualizar regla de red
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Parámetros**:
  - `id`: ID de la regla de red (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    name?: string,
    ipStart?: string,
    ipEnd?: string,
    modality?: string // PRESENTIAL o REMOTE
  }
  ```
- **Respuesta**: 200 OK

#### DELETE /networkrule/:id

- **Descripción**: Eliminar regla de red
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Parámetros**:
  - `id`: ID de la regla de red (obligatorio)
- **Respuesta**: 200 OK

#### GET /networkrule/:id

- **Descripción**: Obtener una regla de red
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Parámetros**:
  - `id`: ID de la regla de red (obligatorio)

#### GET /networkrule

- **Descripción**: Obtener lista de reglas de red
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Query**:
  - `page`: Número de página (opcional) por defecto 1
  - `limit`: Cantidad de resultados por página (opcional) por defecto 10
  - `search`: Búsqueda por nombre (opcional)
  - `sort`: Ordenamiento (opcional) por defecto createdAt-DESC

### Usuarios

#### GET /user

- **Descripción**: Obtener lista de usuarios
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Query**:
  - `page`: Número de página (opcional) por defecto 1
  - `limit`: Cantidad de resultados por página (opcional) por defecto 10
  - `search`: Búsqueda por nombre, apellido o correo del usuario(opcional)
  - `sort`: Ordenamiento (opcional) por defecto createdAt-DESC

#### GET /user/:id

- **Descripción**: Obtener un usuario
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Parámetros**:
  - `id`: ID del usuario (obligatorio)

#### POST /user

- **Descripción**: Crear nuevo usuario
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    email: string,
    password: string,
    name: string,
    lastName: string,
    phone?: string // Opcional
    department: string
  }
  ```
- **Respuesta**: 201 Created

#### PATCH /user/:id

- **Descripción**: Actualizar usuario
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Parámetros**:
  - `id`: ID del usuario (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    email?: string,
    password?: string,
    name?: string,
    lastName?: string,
    phone?: string // Opcional
    department?: string
  }
  ```
- **Respuesta**: 200 OK

#### DELETE /user/:id

- **Descripción**: Eliminar usuario
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **Parámetros**:
  - `id`: ID del usuario (obligatorio)
- **Respuesta**: 200 OK

### Configuración

#### GET /config

- **Descripción**: Obtener configuración del sistema
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)

#### POST /config

- **Descripción**: Crear configuración
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    startTime: string, // Formato: HH:mm:ss
    endTime: string, // Formato: HH:mm:ss
    toleranceMin: number,
    updateBy: string // ID del usuario que actualiza
  }
  ```
- **Respuesta**: 201 Created
- **Nota**: Solo se puede crear una configuración.

#### PATCH /config

- **Descripción**: Actualizar configuración
- **Permisos**: ADMIN
- **Encabezados**:
  - `Authorization`: Bearer [token]
  - `x-forwarded-for`: IP del cliente (obligatorio)
- **DTO de entrada**:
  ```typescript
  {
    startTime?: string // Formato: HH:mm:ss
    endTime?: string // Formato: HH:mm:ss
    toleranceMin?: number
    updateBy?: string // ID del usuario que actualiza
  }
  ```
- **Respuesta**: 200 OK

## Requisitos Técnicos

- Node.js v14 o superior
- PostgreSQL 12 o superior
- npm o yarn
- Git

## Seguridad

- Autenticación JWT
- Validación de IP para modalidad presencial/online
- Roles y permisos basados en tokens
- Validación de datos de entrada
- Protección contra inyección SQL

## Contribución

1. Fork del repositorio
2. Crear una rama para tu funcionalidad (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Endpoints de documentación

- El endpoint de la documentación de la API es: `/docs`
