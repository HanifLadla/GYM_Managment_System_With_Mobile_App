import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import { AlertContainer } from '../components/AlertCard';
import { FiDownload, FiRefreshCw, FiUser, FiCalendar, FiCreditCard, FiCheckCircle } from 'react-icons/fi';

const MemberCard = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [card, setCard] = useState(null);
  const { alerts, addAlert, removeAlert } = useAlert();

  useEffect(() => {
    if (id) fetchMember();
  }, [id]);

  const fetchMember = async () => {
    try {
      const { data } = await axios.get(`/api/members/${id}`);
      setMember(data);
      if (data.card && data.card.length > 0) {
        setCard(data.card[0]);
      } else if (data.card) {
        setCard(data.card);
      }
    } catch (error) {
      addAlert('Failed to load member', 'error');
    }
  };

  const generateCard = async () => {
    try {
      const { data } = await axios.post(`/api/members/${id}/card`);
      setCard(data);
      addAlert('Card generated successfully!', 'success');
      fetchMember();
    } catch (error) {
      addAlert(error.response?.data?.error || 'Failed to generate card', 'error');
    }
  };

  if (!member) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <AlertContainer alerts={alerts} removeAlert={removeAlert} />
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold dark:text-white">Member RFID Card</h1>
        {card && (
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiDownload /> Print Card
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <motion.div
          id="printable-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-[350px] h-[220px]"
        >
          {/* Card Front */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-2xl shadow-2xl overflow-hidden print-gradient">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 print-bg-pattern">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-3xl transform -translate-x-24 translate-y-24"></div>
            </div>

            {/* Card Content */}
            <div className="relative h-full p-6 flex flex-col justify-between text-white">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold tracking-wider">GYM MEMBER</h2>
                  <p className="text-xs opacity-75 mt-1">RFID Access Card</p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <FiUser className="w-6 h-6" />
                </div>
              </div>

              {/* Member Info */}
              <div className="space-y-2">
                <div>
                  <p className="text-xs opacity-75 uppercase tracking-wide">Member Name</p>
                  <p className="text-lg font-bold">{member.name}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs opacity-75 uppercase tracking-wide">Card ID</p>
                    <p className="text-sm font-mono">{card?.id || 'Not Generated'}</p>
                  </div>
                  <div>
                    <p className="text-xs opacity-75 uppercase tracking-wide">Valid Until</p>
                    <p className="text-sm font-semibold whitespace-nowrap">{new Date(member.expiryDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {member.status === 'active' ? (
                    <>
                      <FiCheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-semibold text-green-400">ACTIVE</span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-red-400">INACTIVE</span>
                  )}
                </div>
                <div className="text-xs opacity-50">RFID ENABLED</div>
              </div>
            </div>

            {/* Chip Design */}
            <div className="absolute top-16 right-6 w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded opacity-80 print-chip">
              <div className="grid grid-cols-3 gap-0.5 p-1.5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-yellow-600 rounded-sm"></div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {card && card.qrCodeUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -right-32 top-1/2 transform -translate-y-1/2 bg-white p-4 rounded-xl shadow-xl print:hidden"
            >
              <img 
                src={card.qrCodeUrl} 
                alt="QR Code" 
                className="w-32 h-32"
                onError={(e) => {
                  console.error('QR Code failed to load:', card.qrCodeUrl);
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect fill="%23ddd" width="128" height="128"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo QR%3C/text%3E%3C/svg%3E';
                }}
              />
              <p className="text-xs text-center text-gray-600 mt-2">Scan for Check-in</p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 print:hidden">
        {card ? (
          <>
            <button
              onClick={generateCard}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-700"
            >
              <FiRefreshCw /> Regenerate Card
            </button>
            {!card.qrCodeUrl && (
              <div className="text-red-600 text-sm">⚠️ QR Code not generated properly</div>
            )}
          </>
        ) : (
          <button
            onClick={generateCard}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Generate RFID Card
          </button>
        )}
      </div>

      {/* Card Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow print:hidden"
      >
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Card Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Member ID</p>
            <p className="font-semibold dark:text-white">{member.id.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
            <p className="font-semibold dark:text-white">{member.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Join Date</p>
            <p className="font-semibold dark:text-white">{new Date(member.joinDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Fee</p>
            <p className="font-semibold dark:text-white">${member.monthlyFee}</p>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-card,
          #printable-card * {
            visibility: visible;
          }
          #printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 85.6mm !important;
            height: 54mm !important;
          }
          @page {
            size: 85.6mm 54mm;
            margin: 0;
          }
          .print-gradient {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #581c87 100%) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-bg-pattern {
            opacity: 0.1 !important;
          }
          .print-chip {
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default MemberCard;
