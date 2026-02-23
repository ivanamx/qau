Plataforma Ciudadana y Marketplace Local
Alcaldía Cuauhtémoc – CDMX

**Cómo levantar el proyecto en local:** ver [CONTRIBUTING.md](./CONTRIBUTING.md).

---

1. Visión del Proyecto

Desarrollar una plataforma hiperlocal enfocada exclusivamente en la Alcaldía Cuauhtémoc, con dos objetivos estratégicos:

Transparencia y eficiencia en reportes ciudadanos

Impulso a la economía circular dentro de la alcaldía

La plataforma será modular, escalable y desarrollada con Node.js + TypeScript, integrando Google Maps y Google Places API para visualización y datos comerciales.

2. Arquitectura General
Stack Técnico

Backend

Node.js

TypeScript

Express o Fastify

PostgreSQL (recomendado por estructura relacional y analytics futuros)

Prisma ORM

Frontend

React / Next.js

Google Maps JavaScript API

Google Places API

Infraestructura

VPS o Cloud (Railway, Fly.io, AWS, etc.)

Redis (opcional para caching de Places)

JWT para autenticación

3. Módulo 1: Reportes Ciudadanos
3.1 UX Principal

Pantalla principal:

🗺️ Mapa ocupa 75–80% de la pantalla

📋 Columna lateral con últimos reportes

Filtros por:

Últimas 24 horas

Semana

Mes

Categoría

Estado (Pendiente / En proceso / Resuelto)

Todo filtro afecta simultáneamente:

El mapa

La columna lateral

3.2 Flujo de Usuario Ciudadano
Crear Reporte

Campos:

Categoría

Descripción

Foto (obligatoria)

Geolocalización (pin en mapa)

Fecha automática

Estado inicial: "Pendiente"

Visualización de Reporte

Al hacer clic en un pin del mapa:

Modal con:

Categoría

Fecha

Descripción breve

Foto

Estado

Número de votos

Botón “+1 Apoyar reporte”

Sistema de Votación (+1)

Si el reporte está pendiente:

Usuario registrado puede sumar apoyo sin volver a subir evidencia.

Se guarda relación user_id → reporte_id.

Evita duplicidad.

Ordenamiento interno por:

Número de votos

Tiempo activo

Esto genera presión comunitaria inteligente.

3.3 Estados del Reporte

Pendiente

Validado

Canalizado

En proceso

Resuelto

Rechazado

4. Dashboard Alcaldía
Roles

Superusuario (Alcaldesa y equipo estratégico)

Administrador general

Operador / empleado

Ciudadano

Vista Dashboard

Tabla avanzada con filtros

Métricas:

Reportes por categoría

Tiempo promedio de resolución

Reportes más votados

Heatmap por colonia

Acciones por reporte

Validar

Rechazar

Cambiar estado

Canalizar manualmente

Botón "Llamar responsable"

Historial de cambios

Automatización (Fase 2)

Reglas tipo:

Si categoría == “Luminarias”
→ Enviar automáticamente:

Email a responsable

WhatsApp API

SMS

Webhook interno

Sistema híbrido:

Manual (Fase 1)

Automático por reglas (Fase 2)

5. Módulo 2: Marketplace Local
Objetivo Estratégico

Fomentar economía circular y reducir fuga de capital fuera de la alcaldía.

5.1 Fuente de Datos

Todos los negocios se obtienen vía:

Google Places API

Google Maps API

Se almacena:

place_id

Nombre

Dirección

Calificación

Fotos

Categoría

Se cachea para evitar costos excesivos.

5.2 Vista Principal

Mapa completo de la alcaldía con:

Filtros por categoría

Tooltip enriquecido

Indicador visual especial si tiene oferta activa

Ejemplo:
🔴 Pin normal
🟢 Pin con oferta

5.3 Diferencial de la Plataforma

Lo único que agregamos sobre Google:

Ofertas Locales

Negocios pueden:

Crear oferta

Definir vigencia

Definir condiciones

Subir imagen promocional

Aparece:

En mapa como badge “Oferta”

En sección especial “Ofertas activas”

5.4 Extensiones del Marketplace

Secciones adicionales:

Renta de locales

Intercambio de bienes

Donación de artículos

Bolsa de servicios locales

Siempre restringido a la alcaldía.

6. Verificación de Residentes
Opción 1: Validación con INE

Proceso:

Subida de INE

OCR automático

Validación de sección electoral perteneciente a Cuauhtémoc

No se guarda imagen completa (solo hash + validación)

Consideraciones:

Sensible legalmente

Requiere aviso de privacidad sólido

Opción 2 (Más simple y recomendable fase 1)

Registro con:

Teléfono mexicano

Código SMS

Colonia seleccionable

Sistema de reputación

IP tracking ligero

7. Incentivos para Registro Ciudadano

Aquí es donde debes ser estratégico.

Opciones:

1. Acceso exclusivo a ofertas locales

Solo usuarios registrados pueden:

Ver promociones completas

Redimir descuentos

2. Sistema de reputación

Usuarios ganan puntos por:

Reportes válidos

Votos en reportes

Participación activa

Beneficios:

Insignias

Acceso anticipado a promociones

Sorteos locales patrocinados

3. Ranking de colonias más participativas

Gamificación por colonia.

8. Modelo de Datos Simplificado

Entidades principales:

users

reports

report_votes

report_status_history

businesses (Google cache)

offers

roles

notifications

9. Seguridad

JWT con refresh tokens

Rate limiting en reportes

Anti-spam en votos

Sanitización estricta de inputs

Logs de auditoría para acciones administrativas

10. Roadmap de Desarrollo
Fase 1 – MVP Reportes

Backend reportes

Mapa con pins

Filtros

Dashboard manual

Sistema +1

Fase 2 – Marketplace

Integración Google Places

Caching

Filtros

Ofertas

Fase 3 – Automatización

Reglas por categoría

Notificaciones automáticas

Métricas avanzadas

Fase 4 – Gamificación y economía circular extendida
11. Posicionamiento Estratégico

Esto no es solo una app.

Es:

Transparencia

Datos públicos visuales

Economía local fortalecida

Herramienta política moderna

Bien ejecutado, esto puede convertirse en:

Modelo replicable en otras alcaldías

SaaS para municipios