document.addEventListener('DOMContentLoaded', function () {

    // --- THEME SWITCHER ---
    const themeToggleBtns = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');
    const darkIcons = document.querySelectorAll('#theme-toggle-dark-icon, #theme-toggle-dark-icon-mobile');
    const lightIcons = document.querySelectorAll('#theme-toggle-light-icon, #theme-toggle-light-icon-mobile');
    const htmlEl = document.documentElement;

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlEl.classList.add('dark');
            lightIcons.forEach(icon => icon.classList.remove('hidden'));
            darkIcons.forEach(icon => icon.classList.add('hidden'));
        } else {
            htmlEl.classList.remove('dark');
            lightIcons.forEach(icon => icon.classList.add('hidden'));
            darkIcons.forEach(icon => icon.classList.remove('hidden'));
        }
    };

    const toggleTheme = () => {
        const currentTheme = htmlEl.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    // Initial theme setup
    const storedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(storedTheme || systemTheme);

    themeToggleBtns.forEach(btn => btn.addEventListener('click', toggleTheme));


    // --- LANGUAGE SWITCHER ---
    const translations = {
        // Navigation
        navProducts: { en: 'Products', es: 'Productos', de: 'Produkte', fr: 'Produits', hi: 'उत्पाद' },
        navQuality: { en: 'Quality', es: 'Calidad', de: 'Qualität', fr: 'Qualité', hi: 'गुणवत्ता' },
        navSelector: { en: 'Selector', es: 'Selector', de: 'Auswahl', fr: 'Sélecteur', hi: 'चयनकर्ता' },
        navContact: { en: 'Contact', es: 'Contacto', de: 'Kontakt', fr: 'Contact', hi: 'संपर्क' },
        navQuote: { en: 'Request a Quote', es: 'Solicitar Cotización', de: 'Angebot Anfordern', fr: 'Demander un Devis', hi: 'कोटेशन का अनुरोध करें' },
        navProductsMobile: { en: 'Products', es: 'Productos', de: 'Produkte', fr: 'Produits', hi: 'उत्पाद' },
        navQualityMobile: { en: 'Quality', es: 'Calidad', de: 'Qualität', fr: 'Qualité', hi: 'गुणवत्ता' },
        navSelectorMobile: { en: 'Selector', es: 'Selector', de: 'Auswahl', fr: 'Sélecteur', hi: 'चयनकर्ता' },
        navContactMobile: { en: 'Contact', es: 'Contacto', de: 'Kontakt', fr: 'Contact', hi: 'संपर्क' },
        navQuoteMobile: { en: 'Request a Quote', es: 'Solicitar Cotización', de: 'Angebot Anfordern', fr: 'Demander un Devis', hi: 'कोटेशन का अनुरोध करें' },
        navSettings: { en: 'Settings:', es: 'Ajustes:', de: 'Einstellungen:', fr: 'Paramètres:', hi: 'सेटिंग्स:' },
        // Hero
        heroTitle: { en: 'Stretch Film and Silage Film Exporter from India', es: 'Su Socio Global para Film Estirable a Granel', de: 'Ihr Globaler Partner für Bulk-Stretchfolie', fr: 'Votre Partenaire Mondial pour le Film Étirable en Vrac', hi: 'बल्क स्ट्रेच रैप फिल्म के लिए आपके वैश्विक भागीदार' },
        heroSubtitle: { en: 'We are a premier <strong>exporter of Stretch Film and Silage Film</strong> from <strong>India</strong>, manufacturing high-performance packaging solutions for industrial and agricultural needs globally.', es: 'Fabricamos films estirables de LLDPE de alto rendimiento y calidad de exportación desde Karnataka, India. Ofrecemos fiabilidad, consistencia y valor para su cadena de suministro internacional.', de: 'Herstellung von Hochleistungs-LLDPE-Stretchfolien in Exportqualität aus Karnataka, Indien. Wir liefern Zuverlässigkeit, Konsistenz und Wert für Ihre internationale Lieferkette.', fr: 'Fabrication de films étirables LLDPE haute performance de qualité exportation depuis le Karnataka, en Inde. Nous offrons fiabilité, constance et valeur pour votre chaîne d\'approvisionnement internationale.', hi: 'कर्नाटक, भारत से उच्च-प्रदर्शन, निर्यात-ग्रेड एलएलडीपीई स्ट्रेच फिल्मों का निर्माण। हम आपकी अंतरराष्ट्रीय आपूर्ति श्रृंखला के लिए विश्वसनीयता, स्थिरता और मूल्य प्रदान करते हैं।' },
        quoteButton: { en: 'Get Your Export Pricing Today', es: 'Obtenga su Precio de Exportación Hoy', de: 'Erhalten Sie Heute Ihre Exportpreise', fr: 'Obtenez Vos Prix à l\'Exportation Aujourd\'hui', hi: 'आज ही अपने निर्यात मूल्य निर्धारण प्राप्त करें' },
        // Stats
        statCapacity: { en: 'Annual Manufacturing Capacity', es: 'Capacidad de Producción Anual', de: 'Jährliche Produktionskapazität', fr: 'Capacité de Production Annuelle', hi: 'वार्षिक विनिर्माण क्षमता' },
        statCapability: { en: 'Supply Capability', es: 'Capacidad de Suministro', de: 'Lieferfähigkeit', fr: 'Capacité de Livraison', hi: 'आपूर्ति क्षमता' },
        statRate: { en: 'On-Time Shipment Rate', es: 'Tasa de Envíos a Tiempo', de: 'Pünktlichkeitsrate der Lieferungen', fr: 'Taux d\'Expédition à Temps', hi: 'समय पर शिपमेंट दर' },
        // About
        aboutTitle: { en: 'Engineered for Export Excellence', es: 'Diseñado para la Excelencia en Exportación', de: 'Entwickelt für Exzellenz im Export', fr: 'Conçu pour l\'Excellence à l\'Exportation', hi: 'निर्यात उत्कृष्टता के लिए इंजीनियर' },
        aboutSubtitle: { en: 'Aarya Plastopet combines state-of-the-art manufacturing with a deep understanding of global logistics to be the most reliable stretch film supplier for your business.', es: 'Aarya Plastopet combina fabricación de vanguardia con un profundo conocimiento de la logística global para ser el proveedor de film estirable más confiable para su negocio.', de: 'Aarya Plastopet kombiniert modernste Fertigung mit einem tiefen Verständnis der globalen Logistik, um der zuverlässigste Lieferant von Stretchfolien für Ihr Unternehmen zu sein.', fr: 'Aarya Plastopet combine une fabrication de pointe avec une compréhension approfondie de la logistique mondiale pour être le fournisseur de film étirable le plus fiable pour votre entreprise.', hi: 'आर्य प्लास्टोपेट आपके व्यवसाय के लिए सबसे विश्वसनीय स्ट्रेच फिल्म आपूर्तिकर्ता बनने के लिए अत्याधुनिक विनिर्माण को वैश्विक रसद की गहरी समझ के साथ जोड़ती है।' },
        aboutHeadline: { en: 'Precision, Performance, and Partnership.', es: 'Precisión, Rendimiento y Asociación.', de: 'Präzision, Leistung und Partnerschaft.', fr: 'Précision, Performance et Partenariat.', hi: 'सटीकता, प्रदर्शन और साझेदारी।' },
        aboutPara1: { en: 'Based in Karnataka, India, a hub of industrial innovation, Aarya Plastopet was founded to meet the growing demand for high-quality bulk packaging solutions in the international market. Our production lines utilize advanced technology to produce LLDPE stretch films that offer superior load retention, puncture resistance, and clarity.', es: 'Con sede en Karnataka, India, un centro de innovación industrial, Aarya Plastopet fue fundada para satisfacer la creciente demanda de soluciones de embalaje a granel de alta calidad en el mercado internacional. Nuestras líneas de producción utilizan tecnología avanzada para producir films estirables de LLDPE que ofrecen una retención de carga superior, resistencia a la perforación y claridad.', de: 'Mit Sitz in Karnataka, Indien, einem Zentrum industrieller Innovation, wurde Aarya Plastopet gegründet, um der wachsenden Nachfrage nach hochwertigen Großverpackungslösungen auf dem internationalen Markt gerecht zu werden. Unsere Produktionslinien verwenden fortschrittliche Technologie zur Herstellung von LLDPE-Stretchfolien, die eine überlegene Ladehalterung, Durchstoßfestigkeit und Klarheit bieten.', fr: 'Basée au Karnataka, en Inde, un pôle d\'innovation industrielle, Aarya Plastopet a été fondée pour répondre à la demande croissante de solutions d\'emballage en vrac de haute qualité sur le marché international. Nos lignes de production utilisent une technologie de pointe pour produire des films étirables LLDPE qui offrent une rétention de charge supérieure, une résistance à la perforation et une clarté.', hi: 'औद्योगिक नवाचार के केंद्र, कर्नाटक, भारत में स्थित, आर्य प्लास्टोपेट की स्थापना अंतरराष्ट्रीय बाजार में उच्च गुणवत्ता वाले बल्क पैकेजिंग समाधानों की बढ़ती मांग को पूरा करने के लिए की गई थी। हमारी उत्पादन लाइनें बेहतर लोड प्रतिधारण, पंचर प्रतिरोध और स्पष्टता प्रदान करने वाली एलएलडीपीई स्ट्रेच फिल्मों का उत्पादन करने के लिए उन्नत तकनीक का उपयोग करती हैं।' },
        aboutPara2: { en: 'We are more than just a manufacturer; we are your strategic partner in ensuring your products arrive safely and securely at their international destinations. We manage the complexities of export documentation and logistics so you can focus on your core business.', es: 'Somos más que un simple fabricante; somos su socio estratégico para garantizar que sus productos lleguen de manera segura a sus destinos internacionales. Gestionamos las complejidades de la documentación de exportación y la logística para que pueda centrarse en su negocio principal.', de: 'Wir sind mehr als nur ein Hersteller; wir sind Ihr strategischer Partner, um sicherzustellen, dass Ihre Produkte sicher an ihren internationalen Bestimmungsorten ankommen. Wir verwalten die Komplexität der Exportdokumentation und -logistik, damit Sie sich auf Ihr Kerngeschäft konzentrieren können.', fr: 'Nous sommes plus qu\'un simple fabricant ; nous sommes votre partenaire stratégique pour garantir que vos produits arrivent en toute sécurité à leurs destinations internationales. Nous gérons les complexités de la documentation d\'exportation et de la logistique afin que vous puissiez vous concentrer sur votre cœur de métier.', hi: 'हम सिर्फ एक निर्माता से कहीं बढ़कर हैं; हम यह सुनिश्चित करने में आपके रणनीतिक भागीदार हैं कि आपके उत्पाद सुरक्षित रूप से अपने अंतरराष्ट्रीय गंतव्यों तक पहुंचें। हम निर्यात प्रलेखन और रसद की जटिलताओं का प्रबंधन करते हैं ताकि आप अपने मुख्य व्यवसाय पर ध्यान केंद्रित कर सकें।' },
        // Products
        productsTitle: { en: 'Our Stretch Film Solutions', es: 'Nuestras Soluciones de Film Estirable', de: 'Unsere Stretchfolienlösungen', fr: 'Nos Solutions de Film Étirable', hi: 'हमारे स्ट्रेच फिल्म समाधान' },
        productsSubtitle: { en: 'Tailored for every industrial application, our films guarantee optimal performance and cost-efficiency.', es: 'Diseñados para cada aplicación industrial, nuestros films garantizan un rendimiento óptimo y una rentabilidad.', de: 'Maßgeschneidert für jede industrielle Anwendung garantieren unsere Folien optimale Leistung und Kosteneffizienz.', fr: 'Adaptés à chaque application industrielle, nos films garantissent des performances optimales et une rentabilité.', hi: 'हर औद्योगिक अनुप्रयोग के लिए तैयार, हमारी फिल्में इष्टतम प्रदर्शन और लागत-दक्षता की गारंटी देती हैं।' },
        productMachineTitle: { en: 'Machine Grade Stretch Film', es: 'Film Estirable de Grado Máquina', de: 'Maschinen-Stretchfolie', fr: 'Film Étirable de Qualité Machine', hi: 'मशीन ग्रेड स्ट्रेच फिल्म' },
        productMachineDesc: { en: 'Designed for high-speed, automated pallet wrapping. Our machine films offer excellent pre-stretch capabilities (up to 350%), reducing material consumption while ensuring maximum load stability.', es: 'Diseñado para el envasado automatizado de palets a alta velocidad. Nuestros films para máquina ofrecen excelentes capacidades de pre-estiramiento (hasta 350%), reduciendo el consumo de material y garantizando la máxima estabilidad de la carga.', de: 'Entwickelt für das Hochgeschwindigkeits-, automatisierte Palettenwickeln. Unsere Maschinenfolien bieten hervorragende Vordehnungsmöglichkeiten (bis zu 350%), wodurch der Materialverbrauch reduziert und maximale Ladungsstabilität gewährleistet wird.', fr: 'Conçu pour l\'emballage de palettes automatisé à grande vitesse. Nos films machine offrent d\'excellentes capacités de pré-étirage (jusqu\'à 350 %), réduisant la consommation de matériaux tout en assurant une stabilité de charge maximale.', hi: 'उच्च गति, स्वचालित पैलेट रैपिंग के लिए डिज़ाइन किया गया। हमारी मशीन फिल्में उत्कृष्ट प्री-स्ट्रेच क्षमताएं (350% तक) प्रदान करती हैं, जिससे अधिकतम लोड स्थिरता सुनिश्चित करते हुए सामग्री की खपत कम हो जाती है।' },
        productMachineL1: { en: 'High Tensile Strength & Puncture Resistance', es: 'Alta Resistencia a la Tracción y a la Perforación', de: 'Hohe Zugfestigkeit & Durchstoßfestigkeit', fr: 'Haute Résistance à la Traction et à la Perforation', hi: 'उच्च तन्यता ताकत और पंचर प्रतिरोध' },
        productMachineL2: { en: 'Consistent Thickness and Cling', es: 'Espesor y Adherencia Consistentes', de: 'Gleichbleibende Dicke und Haftung', fr: 'Épaisseur et Adhérence Constantes', hi: 'लगातार मोटाई और चिपटना' },
        productMachineL3: { en: 'Ideal for High-Volume Logistics & Warehousing', es: 'Ideal para Logística y Almacenamiento de Alto Volumen', de: 'Ideal für Großlogistik & Lagerhaltung', fr: 'Idéal pour la Logistique et l\'Entreposage à Grand Volume', hi: 'उच्च-मात्रा रसद और भण्डारण के लिए आदर्श' },
        productMachineL4: { en: 'Available in Various Gauges and Widths', es: 'Disponible en Varios Calibres y Anchos', de: 'In Verschiedenen Stärken und Breiten Erhältlich', fr: 'Disponible en Différentes Épaisseurs et Largeurs', hi: 'विभिन्न गेज और चौड़ाई में उपलब्ध है' },
        productHandTitle: { en: 'Hand Grade Stretch Film', es: 'Film Estirable de Grado Manual', de: 'Hand-Stretchfolie', fr: 'Film Étirable de Qualité Manuelle', hi: 'हैंड ग्रेड स्ट्रेच फिल्म' },
        productHandDesc: { en: 'Our manual wrap films are lightweight, easy to handle, and provide exceptional cling and strength. Perfect for lower volume operations, bundling, or securing irregular loads without machinery.', es: 'Nuestros films de envoltura manual son ligeros, fáciles de manejar y proporcionan una adherencia y resistencia excepcionales. Perfectos para operaciones de menor volumen, agrupar o asegurar cargas irregulares sin maquinaria.', de: 'Unsere manuellen Wickelfolien sind leicht, einfach zu handhaben und bieten außergewöhnliche Haftung und Festigkeit. Perfekt für Betriebe mit geringerem Volumen, zum Bündeln oder Sichern unregelmäßiger Lasten ohne Maschinen.', fr: 'Nos films d\'emballage manuels sont légers, faciles à manipuler et offrent une adhérence et une résistance exceptionnelles. Parfaits pour les opérations à faible volume, le regroupement ou la sécurisation de charges irrégulières sans machinerie.', hi: 'हमारी मैनुअल रैप फिल्में हल्की, संभालने में आसान होती हैं, और असाधारण चिपचिपाहट और ताकत प्रदान करती हैं। कम मात्रा वाले संचालन, बंडलिंग, या मशीनरी के बिना अनियमित भार को सुरक्षित करने के लिए बिल्कुल सही।' },
        productHandL1: { en: 'Superior Clarity for Barcode Scanning', es: 'Claridad Superior para Escaneo de Códigos de Barras', de: 'Überlegene Klarheit für Barcode-Scannen', fr: 'Clarté Supérieure pour la Lecture de Codes-Barres', hi: 'बारकोड स्कैनिंग के लिए सुपीरियर क्लैरिटी' },
        productHandL2: { en: 'Excellent Load Retention', es: 'Excelente Retención de Carga', de: 'Ausgezeichnete Ladehaltung', fr: 'Excellente Rétention de Charge', hi: 'उत्कृष्ट लोड प्रतिधारण' },
        productHandL3: { en: 'Ergonomic and Easy to Apply', es: 'Ergonómico y Fácil de Aplicar', de: 'Ergonomisch und Einfach Anzuwenden', fr: 'Ergonomique et Facile à Appliquer', hi: 'एर्गोनोमिक और लगाने में आसान' },
        productHandL4: { en: 'Cost-Effective for Manual Packaging Needs', es: 'Rentable para Necesidades de Embalaje Manual', de: 'Kostengünstig für Manuelle Verpackungsbedürfnisse', fr: 'Rentable pour les Besoins d\'Emballage Manuel', hi: 'मैनुअल पैकेजिंग जरूरतों के लिए लागत प्रभावी' },
        productColoredTitle: { en: 'Colored Stretch Film', es: 'Film Estirable de Color', de: 'Farbige Stretchfolie', fr: 'Film Étirable Coloré', hi: 'रंगीन स्ट्रेच फिल्म' },
        productColoredDesc: { en: 'Available in various colors (opaque or tinted) for easy load identification, inventory management, or adding a layer of security by concealing contents.', es: 'Disponible en varios colores (opacos o tintados) para una fácil identificación de la carga, gestión de inventario o para añadir una capa de seguridad ocultando el contenido.', de: 'Erhältlich in verschiedenen Farben (opak oder getönt) zur einfachen Ladungsidentifizierung, Bestandsverwaltung oder zum Hinzufügen einer Sicherheitsschicht durch Verbergen des Inhalts.', fr: 'Disponible en différentes couleurs (opaques ou teintées) pour une identification facile des charges, la gestion des stocks ou pour ajouter une couche de sécurité en dissimulant le contenu.', hi: 'आसान लोड पहचान, इन्वेंट्री प्रबंधन, या सामग्री छिपाकर सुरक्षा की एक परत जोड़ने के लिए विभिन्न रंगों (अपारदर्शी या रंगा हुआ) में उपलब्ध है।' },
        productColoredL1: { en: 'Quick Product Categorization', es: 'Categorización Rápida de Productos', de: 'Schnelle Produktkategorisierung', fr: 'Catégorisation Rapide des Produits', hi: 'त्वरित उत्पाद वर्गीकरण' },
        productColoredL2: { en: 'Tamper-Evident Security', es: 'Seguridad a Prueba de Manipulaciones', de: 'Manipulationssichere Sicherheit', fr: 'Sécurité Inviolable', hi: 'छेड़छाड़-स्पष्ट सुरक्षा' },
        productColoredL3: { en: 'Company Branding Opportunity', es: 'Oportunidad de Branding', de: 'Möglichkeit zum Firmenbranding', fr: 'Opportunité de Marque d\'Entreprise', hi: 'कंपनी ब्रांडिंग का अवसर' },
        productColoredL4: { en: 'Reduces Risk of Pilferage', es: 'Reduce el Riesgo de Hurto', de: 'Reduziert das Diebstahlrisiko', fr: 'Réduit le Risque de Vol', hi: 'चोरी का खतरा कम करता है' },
        productUvTitle: { en: 'UV Resistant Film', es: 'Film Resistente a los Rayos UV', de: 'UV-beständige Folie', fr: 'Film Résistant aux UV', hi: 'यूवी प्रतिरोधी फिल्म' },
        productUvDesc: { en: 'Specially formulated with UV inhibitors to protect products from sun degradation during outdoor storage or transit, extending product shelf life.', es: 'Formulado especialmente con inhibidores de UV para proteger los productos de la degradación solar durante el almacenamiento o tránsito al aire libre, extendiendo la vida útil del producto.', de: 'Speziell formuliert mit UV-Inhibitoren, um Produkte vor Sonnenschäden während der Lagerung im Freien oder des Transports zu schützen und die Haltbarkeit des Produkts zu verlängern.', fr: 'Spécialement formulé avec des inhibiteurs d\'UV pour protéger les produits de la dégradation par le soleil pendant le stockage extérieur ou le transport, prolongeant ainsi la durée de vie du produit.', hi: 'बाहरी भंडारण या पारगमन के दौरान उत्पादों को सूर्य के क्षरण से बचाने के लिए यूवी अवरोधकों के साथ विशेष रूप से तैयार किया गया, जिससे उत्पाद की शेल्फ लाइफ बढ़ जाती है।' },
        productUvL1: { en: 'Up to 12 Months UV Protection', es: 'Hasta 12 Meses de Protección UV', de: 'Bis zu 12 Monate UV-Schutz', fr: 'Jusqu\'à 12 Mois de Protection UV', hi: '12 महीने तक यूवी संरक्षण' },
        productUvL2: { en: 'Prevents Discoloration and Damage', es: 'Previene la Decoloración y el Daño', de: 'Verhindert Verfärbung und Beschädigung', fr: 'Prévient la Décoloration et les Dommages', hi: 'रंग बदलना और क्षति को रोकता है' },
        productUvL3: { en: 'Ideal for Agricultural & Construction Goods', es: 'Ideal para Productos Agrícolas y de Construcción', de: 'Ideal für Agrar- & Bauprodukte', fr: 'Idéal pour les Produits Agricoles et de Construction', hi: 'कृषि और निर्माण सामान के लिए आदर्श' },
        productUvL4: { en: 'Maintains Film Integrity Outdoors', es: 'Mantiene la Integridad de la Película al Aire Libre', de: 'Erhält die Folienintegrität im Freien', fr: 'Maintient l\'Intégrité du Film à l\'Extérieur', hi: 'बाहर फिल्म की अखंडता बनाए रखता है' },
        productPrestretchTitle: { en: 'Pre-Stretched Film', es: 'Film Preestirado', de: 'Vorgereckte Folie', fr: 'Film Pré-étiré', hi: 'प्री-स्ट्रेच्ड फिल्म' },
        productPrestretchDesc: { en: 'Stretched close to its ultimate breaking point before being wound onto rolls. This results in a lighter, more efficient roll that requires less user effort to apply.', es: 'Estirado cerca de su punto de ruptura final antes de ser enrollado. Esto resulta en un rollo más ligero y eficiente que requiere menos esfuerzo del usuario para aplicar.', de: 'Nahe an seiner endgültigen Bruchgrenze gedehnt, bevor es auf Rollen gewickelt wird. Dies führt zu einer leichteren, effizienteren Rolle, die weniger Kraftaufwand beim Anlegen erfordert.', fr: 'Étudié près de son point de rupture ultime avant d\'être enroulé sur des rouleaux. Il en résulte un rouleau plus léger et plus efficace qui nécessite moins d\'effort de l\'utilisateur pour être appliqué.', hi: 'रोल पर लपेटे जाने से पहले अपने अंतिम ब्रेकिंग पॉइंट के करीब तक खींचा गया। इसके परिणामस्वरूप एक हल्का, अधिक कुशल रोल होता है जिसे लगाने के लिए कम उपयोगकर्ता प्रयास की आवश्यकता होती है।' },
        productPrestretchL1: { en: 'Up to 50% Film Savings', es: 'Hasta 50% de Ahorro de Film', de: 'Bis zu 50 % Folieneinsparung', fr: 'Jusqu\'à 50 % d\'Économies de Film', hi: '50% तक फिल्म की बचत' },
        productPrestretchL2: { en: 'Easier and Faster Application', es: 'Aplicación Más Fácil y Rápida', de: 'Einfachere und Schnellere Anwendung', fr: 'Application Plus Facile et Plus Rapide', hi: 'आसान और तेज़ अनुप्रयोग' },
        productPrestretchL3: { en: 'Reduced Physical Strain on Workers', es: 'Menor Esfuerzo Físico para los Trabajadores', de: 'Reduzierte Körperliche Belastung für die Arbeiter', fr: 'Réduction de la Fatigue Physique pour les Travailleurs', hi: 'श्रमिकों पर शारीरिक तनाव कम' },
        productPrestretchL4: { en: 'Excellent Load Containment', es: 'Excelente Contención de Carga', de: 'Ausgezeichnete Ladehaltung', fr: 'Excellente Contention de la Charge', hi: 'उत्कृष्ट लोड रोकथाम' },
        productVentedTitle: { en: 'Vented Pallet Wrap', es: 'Envoltura de Palets Ventilada', de: 'Belüftete Palettenverpackung', fr: 'Film d\'Emballage de Palette Ventilé', hi: 'वेंटेड पैलेट रैप' },
        productVentedDesc: { en: 'Engineered with die-cut holes to allow airflow. Ideal for products that need to breathe, such as fresh produce, frozen foods, or items that are hot-filled.', es: 'Diseñado con agujeros troquelados para permitir el flujo de aire. Ideal para productos que necesitan respirar, como productos frescos, alimentos congelados o artículos que se llenan en caliente.', de: 'Entwickelt mit gestanzten Löchern, um Luftzirkulation zu ermöglichen. Ideal für Produkte, die atmen müssen, wie Frischwaren, Tiefkühlkost oder heiß abgefüllte Artikel.', fr: 'Conçu avec des trous découpés pour permettre la circulation de l\'air. Idéal pour les produits qui ont besoin de respirer, tels que les produits frais, les aliments surgelés ou les articles remplis à chaud.', hi: 'हवा के प्रवाह की अनुमति देने के लिए डाई-कट छेदों के साथ इंजीनियर किया गया। उन उत्पादों के लिए आदर्श है जिन्हें सांस लेने की आवश्यकता होती है, जैसे कि ताजा उपज, जमे हुए खाद्य पदार्थ, या गर्म-भरी हुई वस्तुएं।' },
        productVentedL1: { en: 'Prevents Condensation and Spoilage', es: 'Previene la Condensación y el Deterioro', de: 'Verhindert Kondensation und Verderb', fr: 'Empêche la Condensation et la Détérioration', hi: 'संक्षेपण और खराब होने से बचाता है' },
        productVentedL2: { en: 'Faster Cooling or Freezing', es: 'Enfriamiento o Congelación Más Rápida', de: 'Schnelleres Kühlen oder Gefrieren', fr: 'Refroidissement ou Congélation Plus Rapide', hi: 'तेजी से ठंडा या जमना' },
        productVentedL3: { en: 'Maintains Load Integrity', es: 'Mantiene la Integridad de la Carga', de: 'Erhält die Ladungsintegrität', fr: 'Maintient l\'Intégrité de la Charge', hi: 'लोड अखंडता बनाए रखता है' },
        productVentedL4: { en: 'Perfect for Food & Beverage Industry', es: 'Perfecto para la Industria de Alimentos y Bebidas', de: 'Perfekt für die Lebensmittel- & Getränkeindustrie', fr: 'Parfait pour l\'Industrie Agroalimentaire', hi: 'खाद्य और पेय उद्योग के लिए बिल्कुल सही' },
        // Quality
        qualityTitle: { en: 'Our Commitment to Global Standards', es: 'Nuestro Compromiso con los Estándares Globales', de: 'Unser Engagement für Globale Standards', fr: 'Notre Engagement envers les Normes Mondiales', hi: 'वैश्विक मानकों के प्रति हमारी प्रतिबद्धता' },
        qualitySubtitle: { en: 'We build trust through transparency and an unwavering dedication to quality. Every roll of film is a promise of reliability for your international shipments.', es: 'Construimos confianza a través de la transparencia y una dedicación inquebrantable a la calidad. Cada rollo de film es una promesa de fiabilidad para sus envíos internacionales.', de: 'Wir schaffen Vertrauen durch Transparenz und ein unerschütterliches Engagement für Qualität. Jede Folienrolle ist ein Versprechen der Zuverlässigkeit für Ihre internationalen Sendungen.', fr: 'Nous bâtissons la confiance grâce à la transparence et à un dévouement indéfectible à la qualité. Chaque rouleau de film est une promesse de fiabilité pour vos expéditions internationales.', hi: 'हम पारदर्शिता और गुणवत्ता के प्रति अटूट समर्पण के माध्यम से विश्वास बनाते हैं। फिल्म का हर रोल आपके अंतरराष्ट्रीय शिपमेंट के लिए विश्वसनीयता का वादा है।' },
        qualityCard1Title: { en: 'Rigorous Quality Control', es: 'Control de Calidad Riguroso', de: 'Strenge Qualitätskontrolle', fr: 'Contrôle de Qualité Rigoureux', hi: 'कठोर गुणवत्ता नियंत्रण' },
        qualityCard1Desc: { en: 'Our in-house labs conduct continuous testing for tensile strength, elongation, and puncture resistance, ensuring every batch meets or exceeds international specifications.', es: 'Nuestros laboratorios internos realizan pruebas continuas de resistencia a la tracción, elongación y resistencia a la perforación, asegurando que cada lote cumpla o supere las especificaciones internacionales.', de: 'Unsere hauseigenen Labore führen kontinuierliche Tests auf Zugfestigkeit, Dehnung und Durchstoßfestigkeit durch, um sicherzustellen, dass jede Charge die internationalen Spezifikationen erfüllt oder übertrifft.', fr: 'Nos laboratoires internes effectuent des tests continus de résistance à la traction, d\'allongement et de résistance à la perforation, garantissant que chaque lot respecte ou dépasse les spécifications internationales.', hi: 'हमारी इन-हाउस प्रयोगशालाएं तन्यता ताकत, बढ़ाव और पंचर प्रतिरोध के लिए निरंतर परीक्षण करती हैं, यह सुनिश्चित करते हुए कि हर बैच अंतरराष्ट्रीय विनिर्देशों को पूरा करता है या उससे अधिक है।' },
        qualityCard2Title: { en: 'Export-Ready Compliance', es: 'Cumplimiento Listo para la Exportación', de: 'Exportbereite Konformität', fr: 'Conformité Prête à l\'Exportation', hi: 'निर्यात-तैयार अनुपालन' },
        qualityCard2Desc: { en: 'We manufacture our products to be compliant with global standards like RoHS and REACH, ensuring smooth customs clearance in major markets.', es: 'Fabricamos nuestros productos para que cumplan con estándares globales como RoHS y REACH, garantizando un despacho de aduanas sin problemas en los principales mercados.', de: 'Wir stellen unsere Produkte so her, dass sie den globalen Standards wie RoHS und REACH entsprechen, was eine reibungslose Zollabfertigung in den Hauptmärkten gewährleistet.', fr: 'Nous fabriquons nos produits pour qu\'ils soient conformes aux normes mondiales telles que RoHS et REACH, garantissant un dédouanement sans heurts sur les principaux marchés.', hi: 'हम अपने उत्पादों का निर्माण RoHS और REACH जैसे वैश्विक मानकों के अनुपालन के लिए करते हैं, जिससे प्रमुख बाजारों में सुचारू सीमा शुल्क निकासी सुनिश्चित होती है।' },
        qualityCard3Title: { en: 'Pursuing Excellence', es: 'Buscando la Excelencia', de: 'Streben nach Exzellenz', fr: 'Poursuivre l\'Excellence', hi: 'उत्कृष्टता का पीछा' },
        qualityCard3Desc: { en: 'Aarya Plastopet is actively pursuing ISO 9001 certification to formally validate our robust quality management systems and commitment to continuous improvement.', es: 'Aarya Plastopet está buscando activamente la certificación ISO 9001 para validar formalmente nuestros robustos sistemas de gestión de calidad y nuestro compromiso con la mejora continua.', de: 'Aarya Plastopet strebt aktiv die ISO 9001-Zertifizierung an, um unsere robusten Qualitätsmanagementsysteme und unser Engagement für kontinuierliche Verbesserung formell zu validieren.', fr: 'Aarya Plastopet poursuit activement la certification ISO 9001 pour valider formellement nos systèmes de gestion de la qualité robustes et notre engagement envers l\'amélioration continue.', hi: 'आर्य प्लास्टोपेट हमारी मजबूत गुणवत्ता प्रबंधन प्रणालियों और निरंतर सुधार के प्रति प्रतिबद्धता को औपचारिक रूप से मान्य करने के लिए सक्रिय रूप से आईएसओ 9001 प्रमाणन प्राप्त कर रहा है।' },
        // Selector
        selectorTitle: { en: 'Find the Right Film for Your Needs', es: 'Encuentre el Film Adecuado para sus Necesidades', de: 'Finden Sie die Richtige Folie für Ihre Bedürfnisse', fr: 'Trouvez le Film Adapté à Vos Besoins', hi: 'अपनी जरूरतों के लिए सही फिल्म खोजें' },
        selectorSubtitle: { en: 'Use our simple selector to identify the ideal stretch film specifications. For custom requirements, please use our contact form.', es: 'Utilice nuestro selector simple para identificar las especificaciones ideales de film estirable. Para requisitos personalizados, utilice nuestro formulario de contacto.', de: 'Verwenden Sie unseren einfachen Selektor, um die idealen Spezifikationen für Stretchfolien zu ermitteln. Für individuelle Anforderungen verwenden Sie bitte unser Kontaktformular.', fr: 'Utilisez notre sélecteur simple pour identifier les spécifications idéales de film étirable. Pour des exigences personnalisées, veuillez utiliser notre formulaire de contact.', hi: 'आदर्श स्ट्रेच फिल्म विनिर्देशों की पहचान करने के लिए हमारे सरल चयनकर्ता का उपयोग करें। कस्टम आवश्यकताओं के लिए, कृपया हमारे संपर्क फ़ॉर्म का उपयोग करें।' },
        selectorLabel1: { en: 'Application Type', es: 'Tipo de Aplicación', de: 'Anwendungsart', fr: 'Type d\'Application', hi: 'आवेदन का प्रकार' },
        selectorOpt1A: { en: 'Automated Pallet Wrapping', es: 'Envoltura de Palets Automatizada', de: 'Automatische Palettenwicklung', fr: 'Emballage Automatisé de Palettes', hi: 'स्वचालित पैलेट रैपिंग' },
        selectorOpt1B: { en: 'Manual Pallet Wrapping', es: 'Envoltura de Palets Manual', de: 'Manuelle Palettenwicklung', fr: 'Emballage Manuel de Palettes', hi: 'मैनुअल पैलेट रैपिंग' },
        selectorOpt1C: { en: 'Bundling & Small Items', es: 'Agrupación y Artículos Pequeños', de: 'Bündelung & Kleinteile', fr: 'Groupage et Petits Articles', hi: 'बंडलिंग और छोटी वस्तुएं' },
        selectorLabel2: { en: 'Typical Load Weight', es: 'Peso de Carga Típico', de: 'Typisches Ladegewicht', fr: 'Poids de Charge Typique', hi: 'विशिष्ट लोड वजन' },
        selectorOpt2A: { en: 'Light (< 500 kg)', es: 'Ligero (< 500 kg)', de: 'Leicht (< 500 kg)', fr: 'Léger (< 500 kg)', hi: 'हल्का (< 500 किग्रा)' },
        selectorOpt2B: { en: 'Medium (500 - 1000 kg)', es: 'Mediano (500 - 1000 kg)', de: 'Mittel (500 - 1000 kg)', fr: 'Moyen (500 - 1000 kg)', hi: 'मध्यम (500 - 1000 किग्रा)' },
        selectorOpt2C: { en: 'Heavy (> 1000 kg)', es: 'Pesado (> 1000 kg)', de: 'Schwer (> 1000 kg)', fr: 'Lourd (> 1000 kg)', hi: 'भारी (> 1000 किग्रा)' },
        selectorLabel3: { en: 'Load Shape', es: 'Forma de la Carga', de: 'Lastform', fr: 'Forme de la Charge', hi: 'लोड आकार' },
        selectorOpt3A: { en: 'Uniform (Boxes)', es: 'Uniforme (Cajas)', de: 'Gleichmäßig (Kisten)', fr: 'Uniforme (Boîtes)', hi: 'एकसमान (बक्से)' },
        selectorOpt3B: { en: 'Irregular (Sharp Edges)', es: 'Irregular (Bordes Afilados)', de: 'Unregelmäßig (Scharfe Kanten)', fr: 'Irrégulier (Bords Tranchants)', hi: 'अनियमित (तेज किनारे)' },
        selectorButton: { en: 'Show Recommendation', es: 'Mostrar Recomendación', de: 'Empfehlung Anzeigen', fr: 'Afficher la Recommandation', hi: 'सिफारिश दिखाएं' },
        selectorResultTitle: { en: 'Recommendation:', es: 'Recomendación:', de: 'Empfehlung:', fr: 'Recommandation:', hi: 'सिफारिश:' },
        // Contact
        contactTitle: { en: 'Contact Us for a Custom Quote', es: 'Contáctenos para una Cotización Personalizada', de: 'Kontaktieren Sie uns für ein Individuelles Angebot', fr: 'Contactez-nous pour un Devis Personnalisé', hi: 'एक कस्टम उद्धरण के लिए हमसे संपर्क करें' },
        contactSubtitle: { en: 'Our export team is ready to assist you. Provide your details below, and we will respond within one business day.', es: 'Nuestro equipo de exportación está listo para ayudarle. Proporcione sus detalles a continuación y le responderemos en un día hábil.', de: 'Unser Exportteam steht Ihnen zur Verfügung. Geben Sie unten Ihre Daten an, und wir werden innerhalb eines Werktages antworten.', fr: 'Notre équipe d\'exportation est prête à vous aider. Fournissez vos coordonnées ci-dessous, et nous vous répondrons dans un délai d\'un jour ouvrable.', hi: 'हमारी निर्यात टीम आपकी सहायता के लिए तैयार है। नीचे अपना विवरण प्रदान करें, और हम एक व्यावसायिक दिन के भीतर जवाब देंगे।' },
        formName: { en: 'Your Name*', es: 'Su Nombre*', de: 'Ihr Name*', fr: 'Votre Nom*', hi: 'आपका नाम*' },
        formCompany: { en: 'Company Name*', es: 'Nombre de la Empresa*', de: 'Firmenname*', fr: 'Nom de l\'Entreprise*', hi: 'कंपनी का नाम*' },
        formEmail: { en: 'Business Email*', es: 'Correo Electrónico de la Empresa*', de: 'Geschäfts-E-Mail*', fr: 'E-mail Professionnel*', hi: 'व्यावसायिक ईमेल*' },
        formPhone: { en: 'Phone with Country Code', es: 'Teléfono con Código de País', de: 'Telefon mit Ländervorwahl', fr: 'Téléphone avec Indicatif Pays', hi: 'देश कोड के साथ फ़ोन' },
        formVolume: { en: 'Estimated Monthly Volume (MT)', es: 'Volumen Mensual Estimado (TM)', de: 'Geschätztes Monatliches Volumen (MT)', fr: 'Volume Mensuel Estimé (MT)', hi: 'अनुमानित मासिक मात्रा (मीट्रिक टन)' },
        formRegion: { en: 'Export Region / Port', es: 'Región de Exportación / Puerto', de: 'Exportregion / Hafen', fr: 'Région d\'Exportation / Port', hi: 'निर्यात क्षेत्र / बंदरगाह' },
        formMessage: { en: 'Your Message or Specific Requirements', es: 'Su Mensaje o Requisitos Específicos', de: 'Ihre Nachricht oder Spezifische Anforderungen', fr: 'Votre Message ou Exigences Spécifiques', hi: 'आपका संदेश या विशिष्ट आवश्यकताएँ' },
        formConsent: { en: 'I consent to Aarya Plastopet contacting me in response to this inquiry and agree to the', es: 'Consiento que Aarya Plastopet me contacte en respuesta a esta consulta y acepto la', de: 'Ich stimme zu, dass Aarya Plastopet mich bezüglich dieser Anfrage kontaktiert und stimme der', fr: 'Je consens à ce qu\'Aarya Plastopet me contacte en réponse à cette demande et j\'accepte la', hi: 'मैं इस पूछताछ के जवाब में आर्य प्लास्टोपेट द्वारा मुझसे संपर्क करने की सहमति देता हूं और इससे सहमत हूं' },
        formPrivacy: { en: 'Privacy Policy', es: 'Política de Privacidad', de: 'Datenschutzrichtlinie', fr: 'Politique de Confidentialité', hi: 'गोपनीयता नीति' },
        formSubmit: { en: 'Submit Inquiry', es: 'Enviar Consulta', de: 'Anfrage Senden', fr: 'Envoyer la Demande', hi: 'पूछताछ सबमिट करें' },
        contactInfoTitle: { en: 'Contact Information', es: 'Información de Contacto', de: 'Kontaktinformationen', fr: 'Coordonnées', hi: 'संपर्क जानकारी' },
        contactEmail: { en: 'Email:', es: 'Correo Electrónico:', de: 'Email:', fr: 'E-mail:', hi: 'ईमेल:' },
        contactPhone: { en: 'Phone:', es: 'Teléfono:', de: 'Telefon:', fr: 'Téléphone:', hi: 'फ़ोन:' },
        contactAddress: { en: 'Address:', es: 'Dirección:', de: 'Adresse:', fr: 'Adresse:', hi: 'पता:' },
        contactAssistance: { en: 'Immediate Assistance', es: 'Asistencia Inmediata', de: 'Sofortige Hilfe', fr: 'Assistance Immédiate', hi: 'तत्काल सहायता' },
        contactWhatsapp: { en: 'Chat on WhatsApp', es: 'Chatear en WhatsApp', de: 'Chat auf WhatsApp', fr: 'Discuter sur WhatsApp', hi: 'व्हाट्सएप पर चैट करें' },
        // Footer
        footerPrivacy: { en: 'Privacy Policy', es: 'Política de Privacidad', de: 'Datenschutzrichtlinie', fr: 'Politique de Confidentialité', hi: 'गोपनीयता नीति' },
        footerTerms: { en: 'Terms of Service', es: 'Términos de Servicio', de: 'Nutzungsbedingungen', fr: 'Conditions d\'Utilisation', hi: 'सेवा की शर्तें' }
    };
    const availableLangs = ['en', 'es', 'de', 'fr', 'hi'];
    const langBtns = document.querySelectorAll('#lang-switcher-btn, #lang-switcher-btn-mobile');
    const langDropdown = document.getElementById('lang-switcher-dropdown');
    const langBtnTexts = document.querySelectorAll('#lang-btn-text, #lang-btn-text-mobile');

    if (langBtns.length > 0) {
        langBtns[0].addEventListener('click', (e) => { // Desktop button
            e.stopPropagation();
            if (langDropdown) langDropdown.classList.toggle('hidden');
        });
    }

    const setLanguage = (lang) => {
        // Update text content
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (translations[key] && translations[key][lang]) {
                el.innerHTML = translations[key][lang];
            }
        });

        // Update form placeholders
        document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
            const key = el.getAttribute('data-lang-placeholder');
            if (translations[key] && translations[key][lang]) {
                el.placeholder = translations[key][lang];
            }
        });

        langBtnTexts.forEach(span => span.textContent = lang.toUpperCase());
        if (langDropdown) langDropdown.classList.add('hidden');
        localStorage.setItem('language', lang);
    };

    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            setLanguage(e.target.dataset.lang);
        });
    });

    // Set language for mobile button (cycle through languages)
    if (langBtns.length > 1) {
        langBtns[1].addEventListener('click', () => {
            const currentLang = localStorage.getItem('language') || 'en';
            const currentIndex = availableLangs.indexOf(currentLang);
            const nextIndex = (currentIndex + 1) % availableLangs.length;
            setLanguage(availableLangs[nextIndex]);
        });
    }

    // Close dropdown if clicked outside
    window.addEventListener('click', (e) => {
        if (langBtns.length > 0 && !langBtns[0].contains(e.target) && langDropdown) {
            langDropdown.classList.add('hidden');
        }
    });

    // On Load: Set language from memory or default to 'en'
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);


    // --- GENERAL ---
    // Mobile Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Set current year in footer
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Interactive Product Selector Logic
    const selectorButton = document.getElementById('selector-button');
    const resultDiv = document.getElementById('selector-result');
    const resultText = document.getElementById('result-text');

    if (selectorButton) {
        selectorButton.addEventListener('click', () => {
            const appType = document.getElementById('application_type').value;
            const loadWeight = document.getElementById('load_weight').value;
            const loadShape = document.getElementById('load_shape').value;
            let recommendation = '';

            if (appType.includes('Automated')) {
                if (loadWeight.includes('Heavy') || loadWeight.includes('Pesado') || loadShape.includes('Irregular')) {
                    recommendation = 'Our high-performance Machine Grade Film (23-30 microns) is recommended for maximum puncture resistance and load retention.';
                } else {
                    recommendation = 'Our standard Machine Grade Film (17-23 microns) provides excellent efficiency and stability for your needs.';
                }
            } else { // Manual wrapping or bundling
                if (loadShape.includes('Irregular')) {
                    recommendation = 'Consider our robust Hand Grade Film (20-25 microns) for superior strength on challenging loads.';
                } else {
                    recommendation = 'Our versatile Hand Grade Film (15-20 microns) is ideal for general purpose manual wrapping and bundling.';
                }
            }

            resultText.textContent = recommendation;
            resultDiv.classList.remove('hidden');
        });
    }

    // Scroll Animation Logic
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    animatedElements.forEach(el => {
        observer.observe(el);
    });

    // --- MARKET SELECTION MODAL LOGIC ---
    const marketModal = document.getElementById('market-modal');
    const marketModalContent = document.getElementById('market-modal-content');
    let currentProductType = '';

    if (marketModal) {
        window.openMarketModal = (type) => {
            currentProductType = type;
            marketModal.classList.remove('hidden');
            setTimeout(() => {
                marketModalContent.classList.remove('scale-95', 'opacity-0');
                marketModalContent.classList.add('scale-100', 'opacity-100');
            }, 10);
        };

        window.closeMarketModal = () => {
            marketModalContent.classList.remove('scale-100', 'opacity-100');
            marketModalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                marketModal.classList.add('hidden');
                currentProductType = '';
            }, 300);
        };

        window.selectMarket = (market) => {
            let url = '';
            // Domestic Logic
            if (market === 'india') {
                if (currentProductType === 'hand' || currentProductType === 'machine') {
                    url = 'india/stretch-film.html';
                } else if (currentProductType === 'silage') {
                    url = 'india/silage-film.html';
                }
            }
            // Export Logic
            else if (market === 'export') {
                if (currentProductType === 'hand' || currentProductType === 'machine') {
                    url = 'export/stretch-film.html';
                } else if (currentProductType === 'silage') {
                    url = 'export/silage-film.html';
                }
            }

            if (url) {
                window.location.href = url;
            }
            closeMarketModal();
        };

        // Close when clicking outside
        marketModal.addEventListener('click', (e) => {
            if (e.target === marketModal) {
                closeMarketModal();
            }
        });
    }

});
