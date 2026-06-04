import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon as ArrowLeft, HeartIcon as Heart } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Donate() {
  const [copiedText, setCopiedText] = useState('');

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const [showModal, setShowModal] = useState(false);

  const tryOpenApp = (schemeUrl, fallbackUrl) => {
    if (typeof window === 'undefined') return;
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = schemeUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch (e) {}
        // fallback to telephone link if app didn't open
        window.location.href = fallbackUrl;
      }, 800);
    } catch (e) {
      window.location.href = fallbackUrl;
    }
  };

  const donationOptions = [
    {
      name: 'PayPal',
      description: 'Paiement sécurisé par PayPal',
      url: 'https://paypal.me/julessane94',
      color: 'from-blue-600 to-blue-700',
      icon: '💳',
    },
    {
      name: 'Wave',
      description: 'Transfert d\'argent rapide et gratuit',
      info: '+221 778 851 691',
      color: 'from-purple-600 to-purple-700',
      icon: '📱',
      type: 'direct',
    },
    {
      name: 'Orange Money',
      description: 'Service de paiement mobile sénégalais',
      info: '+221 778 851 691',
      color: 'from-orange-500 to-orange-600',
      icon: '🟠',
      type: 'direct',
    },
    {
      name: 'Virement Bancaire',
      description: 'Virement bancaire direct',
      info: 'julessane94@gmail.com',
      color: 'from-green-600 to-green-700',
      icon: '🏦',
      type: 'email',
    },
    {
      name: 'Virement SOS Chèques Postaux',
      description: 'Chèque postal sénégalais',
      info: 'julessane94@gmail.com',
      color: 'from-yellow-600 to-yellow-700',
      icon: '📮',
      type: 'email',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-pink-600 to-rose-600 py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-3"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <Link href="/">
            <a className="inline-flex items-center text-white hover:text-red-100 transition mb-6">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </a>
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-white animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Soutenir Signal-Moi
            </h1>
          </div>
          <p className="text-xl text-red-100 max-w-2xl">
            Votre don nous aide à continuer notre mission de transparence et de responsabilité citoyenne
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        {/* Why Donate Section */}
        <motion.section variants={itemVariants} className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Pourquoi soutenir Signal-Moi ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold text-gray-900 mb-2">Transparence</h3>
              <p className="text-gray-700">
                Nous aider à maintenir une plateforme ouverte et transparente pour les citoyens
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-700">
                Financer le développement de nouvelles fonctionnalités et améliorations
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="font-semibold text-gray-900 mb-2">Impact Social</h3>
              <p className="text-gray-700">
                Créer un véritable changement social à travers la participation citoyenne
              </p>
            </div>
          </div>
        </motion.section>

        {/* Donation Methods */}
        <motion.section variants={itemVariants} className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Moyens de donation
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {donationOptions.map((option, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className={`bg-gradient-to-br ${option.color} p-6 rounded-lg shadow-lg text-white cursor-pointer hover:shadow-xl transition`}
                onClick={() => {
                  if (option.url) {
                    window.open(option.url, '_blank');
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{option.icon}</div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold">{option.name}</h3>
                    <p className="text-sm opacity-90">{option.description}</p>
                  </div>
                </div>
                
                {option.type === 'direct' && (
                  <div className="mt-4 bg-white bg-opacity-20 rounded p-3">
                    <p className="text-xs opacity-75 mb-2">Numéro de contact:</p>
                    <div className="flex items-center justify-between">
                      <code className="font-mono font-bold text-sm">{option.info}</code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(option.info, option.name);
                        }}
                        className="px-3 py-1 bg-white text-gray-900 text-xs font-semibold rounded hover:bg-gray-100 transition"
                      >
                        {copiedText === option.name ? '✓ Copié' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}

                {option.type === 'email' && (
                  <div className="mt-4 bg-white bg-opacity-20 rounded p-3">
                    <p className="text-xs opacity-75 mb-2">Email de contact:</p>
                    <div className="flex items-center justify-between">
                      <code className="font-mono font-bold text-sm">{option.info}</code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(option.info, option.name);
                        }}
                        className="px-3 py-1 bg-white text-gray-900 text-xs font-semibold rounded hover:bg-gray-100 transition"
                      >
                        {copiedText === option.name ? '✓ Copié' : 'Copier'}
                      </button>
                    </div>
                  </div>
                )}

                {option.url && (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(option.url, '_blank');
                      }}
                      className="flex-1 bg-white text-gray-900 font-semibold py-2 rounded hover:bg-gray-100 transition"
                    >
                      Ouvrir
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Donation Amounts */}
        <motion.section variants={itemVariants} className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Montants suggérés
          </h2>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[5000, 10000, 25000, 50000, 100000].map((amount) => (
                <motion.div
                  key={amount}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:shadow-lg transition cursor-pointer text-center"
                >
                  <p className="text-2xl font-bold text-red-600">{amount.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {(amount / 656).toFixed(2)} €
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="text-gray-600 text-center mt-6 italic">
              Chaque don, peu importe le montant, nous aide énormément ! 💝
            </p>
          </div>
        </motion.section>

        {/* FAQ Section */}
        <motion.section variants={itemVariants}>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">🔒 Mes dons sont-ils sécurisés ?</h3>
              <p className="text-gray-700">
                Oui, tous les systèmes de paiement (PayPal, Wave, Orange Money) utilisent le chiffrement SSL et des protocoles de sécurité avancés.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">📧 Puis-je obtenir une facture ?</h3>
              <p className="text-gray-700">
                Contactez-nous à <strong>julessane94@gmail.com</strong> avec les détails de votre don pour recevoir une facture.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">💵 Quel est l'usage de mes dons ?</h3>
              <p className="text-gray-700">
                Vos dons sont utilisés pour :
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Améliorer et maintenir la plateforme</li>
                  <li>Développer de nouvelles fonctionnalités</li>
                  <li>Couvrir les frais d'hébergement et de serveurs</li>
                  <li>Former les utilisateurs et les forces de sécurité</li>
                </ul>
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">🎁 Y a-t-il des avantages pour les donateurs ?</h3>
              <p className="text-gray-700">
                Tous les donateurs réguliers reçoivent des mises à jour exclusives et peuvent devenir "Ambassadeurs Signal-Moi" avec un statut spécial sur la plateforme.
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section variants={itemVariants} className="mt-20 text-center">
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Prêt à soutenir Signal-Moi ?</h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Votre contribution est précieuse et nos remerciements sont sincères. Ensemble, nous créons un avenir plus transparent et responsable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-3 bg-white text-red-600 font-bold rounded-lg hover:bg-gray-100 transition"
              >
                Faire un don maintenant
              </button>
              <Link href="/">
                <a className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:bg-opacity-10 transition">
                  Retour à l'accueil
                </a>
              </Link>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Donation modal: Wave, Orange Money, PayPal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Choisir un moyen de donation</h3>
            <p className="text-sm text-gray-600 mb-4">Sélectionnez Wave ou Orange Money pour ouvrir l'application et pré-sélectionner le numéro, ou PayPal pour ouvrir la page de paiement.</p>
            <div className="space-y-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  tryOpenApp('wave://send?recipient=221778851691', 'tel:+221778851691');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold"
              >
                Ouvrir Wave (778851691)
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  tryOpenApp('om://send?phone=221778851691', 'tel:+221778851691');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold"
              >
                Ouvrir Orange Money (778851691)
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(donationOptions[0]?.url || 'https://paypal.me/julessane94', '_blank');
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold"
              >
                Ouvrir PayPal
              </button>
            </div>

            <div className="mt-4 text-right">
              <button onClick={() => setShowModal(false)} className="text-sm text-gray-600 hover:underline">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
