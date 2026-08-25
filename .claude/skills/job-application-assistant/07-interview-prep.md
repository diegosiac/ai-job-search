---
framework_version: 1.0.0
---

# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

## STAR Format

Structure answers as: **Situation** (context), **Task** (your responsibility), **Action** (what you did), **Result** (outcome).

Keep answers to 1-2 minutes. Be specific. End with what you learned or would do differently.

## Ready-Made STAR Examples

<!-- Populated by /setup from Diego's actual experience. Answers are delivered in neutral professional Spanish; interviews are conducted in Spanish (English-required roles are disqualified before reaching an interview). -->

### 1. Reducción del 45.5% en costos de AWS en iVentas (optimización de costos, análisis de causa raíz)
**S:** En iVentas, un CRM de WhatsApp para negocios de LATAM con crecimiento del 200% anual, el gasto en infraestructura de AWS crecía mes a mes sin que nadie tuviera claridad de a dónde se iba el dinero.
**T:** Como responsable de la infraestructura, me propuse auditar el gasto completo, identificar los servicios más costosos y reducir el costo sin sacrificar rendimiento.
**A:** Audité AWS Cost Explorer para identificar los servicios con mayor gasto. Al analizarlos encontré un pico anormal de egreso en S3; lo rastreé hasta la causa raíz: un error de caché a nivel de aplicación que provocaba descargas repetidas innecesarias. Corregí el error en el código y además reconfiguré varios recursos para aprovechar mejor su capacidad.
**R:** El costo de infraestructura en AWS bajó aproximadamente 45.5%, con mejor rendimiento que antes. La auditoría de costos quedó como práctica recurrente.
**Use for:** "Cuéntame de un problema difícil que resolviste", "¿Cómo has generado impacto medible?", "Háblame de una investigación técnica larga", perfiles de consultoría cloud/AWS.

### 2. De 2 caídas diarias a cero: Docker + ECS con autoescalado (confiabilidad, infraestructura)
**S:** En iVentas, un servicio crítico sufría 2 caídas totales al día, de unos 30 minutos cada una, y afectaban a clientes grandes. El servicio era el cuello de botella de toda la plataforma.
**T:** Necesitaba eliminar las caídas de forma definitiva, sin aumentar el costo de infraestructura, en un sistema en producción con tráfico real.
**A:** Investigué a fondo el comportamiento del servicio bajo carga; fue una investigación larga, con mucha depuración y pruebas. Contenericé el servicio con Docker y lo desplegué en ECS con autoescalado basado en carga. Configuré el esquema de pago por uso de modo que el escalado no agregara costo fijo.
**R:** Las caídas pasaron de 2 diarias a cero durante meses, sin costo adicional de AWS. Los clientes grandes dejaron de verse afectados.
**Use for:** "Cuéntame de una situación de alta presión o incidentes en producción", "¿Cómo abordas problemas de escalabilidad?", "Describe una migración que hayas liderado".

### 3. Marketplace de Geekmobile entregado como freelance (entrega de punta a punta, autonomía)
**S:** Iniciativa Geekmobile necesitaba un marketplace de dispositivos móviles y refacciones, y no tenía equipo de desarrollo; me contrataron como freelance para un proyecto cerrado de aproximadamente 6 meses (mayo a septiembre de 2023).
**T:** Era el único desarrollador: tenía que construir el marketplace completo, de punta a punta, incluyendo el cobro en línea, y entregarlo dentro del plazo acordado.
**A:** Diseñé y construí la aplicación completa: frontend, backend y la integración de la pasarela de pagos de PayPal. Gestioné yo mismo la comunicación con el cliente, los alcances y las prioridades durante todo el proyecto.
**R:** Entregué el marketplace funcionando dentro del plazo del contrato, con pagos en línea operativos vía PayPal. Fue mi primera entrega completa como freelance independiente y la base de mi oferta actual de trabajo por proyecto.
**Use for:** "¿Has trabajado como freelance o por proyecto?", "Cuéntame de un proyecto que hayas manejado solo", "¿Cómo gestionas alcances y plazos con un cliente?".

### 4. Adopción de desarrollo AI-native con Claude Code en iVentas (innovación, flujos de trabajo con IA)
**S:** En iVentas, el equipo necesitaba entregar más rápido: había una migración del frontend legado hacia microservicios y microfrontends en curso, además del desarrollo continuo de producto.
**T:** Quería integrar agentes de IA al flujo de desarrollo de forma seria, no como experimento aislado, y empujar a la empresa hacia un modelo de desarrollo AI-native.
**A:** Construí herramientas internas que conectan agentes de IA, en particular Claude Code, con los sistemas de la empresa. Incorporé los agentes a la migración del frontend para acelerar la implementación y la revisión de código, siempre con revisión humana cuidadosa antes de integrar cambios.
**R:** La entrega de funcionalidades se volvió notablemente más rápida manteniendo la calidad gracias a la revisión humana. La empresa avanzó hacia un flujo de desarrollo AI-native, y hoy soy el referente interno de estas herramientas.
**Use for:** "¿Cómo usas la IA en tu trabajo?", "Cuéntame de una vez que introdujiste una mejora de proceso", "¿Cómo te mantienes actualizado?", roles de agentes de IA/chatbots.

## Common Tough Questions

### "Why did you leave [previous company]?"
> [PREPARE YOUR ANSWER - be honest, forward-looking, no negativity about former employer]

### "You don't have [specific skill/experience]."
> [PREPARE YOUR ANSWER - acknowledge the gap, bridge to adjacent experience, show willingness to learn]

### "Where do you see yourself in 5 years?"
> [PREPARE YOUR ANSWER - show ambition aligned with the role's growth path]

### "What's your biggest weakness?"
> [PREPARE YOUR ANSWER - genuine weakness with concrete mitigation strategy]

### "Why this company specifically?"
> Customize per company. Must reference: specific projects, company values, market position, or team structure. Never give a generic answer.

## Questions You Should Ask Interviewers

### About the Role
- "What does a typical week look like in this role?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About the Team
- "How big is the team, and how do you divide work?"
- "What does the development/project lifecycle look like, from idea to production?"
- "How do you onboard new team members?"

### About Tech & Growth
- "What's your current tech stack for [relevant area]?"
- "Is there room to grow into more architectural or strategic decisions?"
- "How does the team stay current with new tools and methods?"

### About Culture (use these to prevent disappointment)
- "How would you describe the team culture?"
- "What does professional development look like here?"
- "Is there flexibility for remote/hybrid work?"
- "What's the balance between development/new projects and maintenance work?"
- "How would you describe the leadership style in this team?"
- "What do people who thrive here have in common?"

## Phone/Video Interview Tips
- Have STAR examples written out (use this file)
- Keep a glass of water nearby
- Smile when speaking (it changes your tone)
- Ask for clarification if a question is vague
- It's OK to take 5 seconds to think before answering
- End with: "Is there anything else you'd like to know about my background?"

## After the Application (Best Practice)

### Follow-Up Etiquette
- **Don't call to "stand out"** or to learn more about the role post-submission - this risks a negative impression
- If the employer specified a timeline, respect it and wait
- If no timeline was given and significant time has passed (2+ weeks), a brief call to ask about status is acceptable
- If you have genuinely new, relevant information to share, a short follow-up is fine

### Thank-You Notes
- When you receive any update (interview invitation, rejection, or status update), send a brief thank-you message
- Express appreciation for their time and the process
- Keep it short (2-3 sentences)

## Roleplay Guidelines
When the user asks for interview practice:
1. Ask which role/company to simulate
2. Start with easy warm-up questions ("Tell me about yourself")
3. Progress to role-specific technical questions
4. Include 1-2 behavioral questions using the competencies from the job posting
5. End with a tough question or curveball
6. After each answer, give brief feedback: what worked, what to sharpen
7. Suggest which STAR example would work best for each question
