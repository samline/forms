# New Project

## Instrucción Para La IA

Este archivo indica cómo debe abordar la IA el inicio de un proyecto nuevo.

Es una base inicial y deberá actualizarse en el futuro, pero desde ahora sirve como checklist mínimo para no arrancar un proyecto sin información suficiente.

## Regla Principal

Si el usuario pide crear un proyecto nuevo, la IA debe pedir primero la información necesaria antes de generar código, instalar dependencias o definir una arquitectura.

## Tipos De Proyecto Que Deben Identificarse

Antes de empezar, la IA debe confirmar qué tipo de proyecto se va a crear. Ejemplos:

1. Astro
2. Next.js
3. paquete npm
4. Laravel
5. aplicación Node.js
6. sitio estático
7. librería frontend
8. API backend
9. monorepo

## Información Que La IA Debe Solicitar

### Datos base

1. nombre del proyecto
2. tipo de proyecto
3. objetivo funcional
4. alcance inicial
5. stack o framework principal

### Dependencias y versiones

1. dependencias runtime requeridas
2. dependencias de desarrollo requeridas
3. versiones mínimas o exactas si son importantes
4. versión de Node o runtime objetivo

### Configuración

1. gestor de paquetes preferido
2. TypeScript o JavaScript
3. estrategia de testing
4. lint y formateo deseados
5. build, deploy y entorno de ejecución
6. si habrá CI o publicación automatizada

### Entregables

1. estructura de carpetas esperada
2. primeras funcionalidades necesarias
3. documentación inicial requerida
4. si debe quedar listo para producción o solo como base inicial

## Regla De Implementación

La IA no debe asumir configuraciones por defecto importantes cuando el usuario no las haya definido y el impacto arquitectónico sea alto.

Debe pedir confirmación al menos para:

1. framework o plataforma
2. dependencias principales
3. versiones importantes
4. estrategia de despliegue
5. alcance inicial del proyecto

## Uso Junto Con Otros Archivos

Si el nuevo proyecto es un paquete similar al de este repositorio, la IA también debe revisar package-replication-guide.md.

Si el nuevo proyecto tendrá release automatizado, la IA también debe revisar deploy-and-release-guide.md.

Si el usuario deja decisiones pendientes, deben registrarse en todo.md.

Si durante el trabajo el usuario corrige patrones de comportamiento de la IA, deben registrarse en lessons.md.

## Estado Actual

Este archivo es una base inicial. Su contenido deberá ampliarse cuando el usuario defina flujos concretos para tipos de proyecto específicos.
