import React from 'react';
import { Box } from '@mui/material';
import ulogo from '../assets/ulogo.png';

export default function ChallanPrint({ data }) {
  if (!data) return null;

  const counts = {
    Pallet: data.components?.find(c => c.type === 'Pallet')?.qty || 0,
    Sleeve: data.components?.find(c => c.type === 'Sleeve')?.qty || 0,
    Lid: data.components?.find(c => c.type === 'Lid')?.qty || 0,
    Insert: data.components?.find(c => c.type === 'Insert')?.qty || 0,
    'Layer Pad': data.components?.find(c => c.type === 'Layer Pad')?.qty || 0,
  };

  return (
    <>
      {/* 1. CSS PRINT RULES to force exact 1 page and hide the rest of the app */}
      <style>
        {`
          @media print {
            @page { margin: 0; size: 120mm 185mm; }
            body * { visibility: hidden; }
            .print-section, .print-section * { visibility: visible; }
            .print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 120mm;
              height: 185mm;
              margin: 0;
              padding: 0;
              page-break-after: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      {/* 2. Main Challan Wrapper */}
      <Box 
        className="print-section"
        sx={{ 
          width: { xs: '100%', sm: '120mm' }, 
          height: { xs: 'auto', sm: '185mm' }, // Fixed height on desktop/print
          mx: 'auto', 
          p: { xs: 2, sm: '4mm' }, 
          bgcolor: '#fff', 
          color: '#000',
          border: '1px solid #000', 
          fontFamily: 'Arial, sans-serif',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column', // Flex column so table can stretch
          
          '@media print': { 
            border: 'none', 
            boxShadow: 'none', 
            padding: '4mm',
          }
        }}
      >
        
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' }, 
          justifyContent: 'space-between', 
          mb: 1.5, 
          borderBottom: '2px solid #000', 
          pb: 1,
          textAlign: { xs: 'center', sm: 'left' },
          flexShrink: 0 // Prevents header from squishing
        }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 1.5 }}>
             <Box 
               component="img" 
               src={ulogo} 
               alt="Unostar Logo" 
               sx={{ width: { xs: 50, sm: 60 }, height: 'auto', objectFit: 'contain' }} 
             />
             <Box>
               <Box sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 'bold' }}>Unostar Value Chain Pvt. Ltd.</Box>
               <Box sx={{ fontSize: 10, mt: 0.5 }}>Plot no. PAP-67, Supa - Parner Industrial Park, Taluka - Parner, Dist.-Ahilyanagar</Box>
             </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: 14, mb: 1.5, flexShrink: 0 }}>DELIVERY CHALLAN</Box>

        {/* Info Grid */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          border: '1px solid #000', 
          mb: 1.5,
          flexShrink: 0
        }}>
          <Box sx={{ 
            flex: 1, 
            p: 1.5, 
            borderRight: { xs: 'none', sm: '1px solid #000' }, 
            borderBottom: { xs: '1px solid #000', sm: 'none' } 
          }}>
            <Box sx={{ fontWeight: 'bold', mb: 0.5, fontSize: 12 }}>To,</Box>
            <Box sx={{ fontWeight: 'bold', fontSize: 14 }}>{data.to_name || 'Uno Minda Limited'}</Box>
            <Box sx={{ fontSize: 11, mt: 0.5 }}>{data.to_address || 'Supa Parner Industrial Area, Village Apdhup, Ahilyanagar - 414301'}</Box>
          </Box>
          
          <Box sx={{ flex: 1, fontSize: 11 }}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #000', p: 0.8 }}><Box sx={{ width: 90 }}>Challan No. :</Box> <Box sx={{ fontWeight: 'bold' }}>{data.challan_no}</Box></Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #000', p: 0.8 }}><Box sx={{ width: 90 }}>Date :</Box> <Box>{new Date(data.challan_date).toLocaleDateString('en-GB')}</Box></Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #000', p: 0.8 }}><Box sx={{ width: 90 }}>L.R. No. :</Box> <Box>{data.lr_no || ''}</Box></Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #000', p: 0.8 }}><Box sx={{ width: 90 }}>Vehicle No. :</Box> <Box>{data.vehicle_no || ''}</Box></Box>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #000', p: 0.8 }}><Box sx={{ width: 90 }}>Driver Name :</Box> <Box>{data.driver_name || ''}</Box></Box>
            <Box sx={{ display: 'flex', p: 0.8 }}><Box sx={{ width: 90 }}>Mob. :</Box> <Box>{data.driver_mob || ''}</Box></Box>
          </Box>
        </Box>

        <Box sx={{ fontSize: 11, mb: 1.5, flexShrink: 0 }}>
          <Box>Dear Sir,</Box>
          <Box sx={{ mt: 0.5, lineHeight: 1.4 }}>Kindly receive the following materials in good condition. Please acknowledge receipt by returning one duly signed and stamped copy of the delivery challan to us.</Box>
        </Box>

        {/* 3. Items Table - Automatically stretches to fill remaining space */}
        <Box sx={{ 
          border: '1px solid #000', 
          mb: 1.5, 
          flex: 1, // <--- THIS IS THE MAGIC. It fills the page perfectly.
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0, // Prevents overflow
          overflow: 'hidden' 
        }}>
          {/* Table Header */}
          <Box sx={{ display: 'flex', bgcolor: '#eee', borderBottom: '1px solid #000', fontWeight: 'bold', fontSize: 11, flexShrink: 0 }}>
            <Box sx={{ width: 40, p: 0.8, borderRight: '1px solid #000', textAlign: 'center' }}>Sr. No.</Box>
            <Box sx={{ flex: 1, p: 0.8, borderRight: '1px solid #000', textAlign: 'center' }}>Material Code</Box>
            <Box sx={{ flex: 2, p: 0.8, borderRight: '1px solid #000', textAlign: 'center' }}>Description of Material</Box>
            <Box sx={{ width: 50, p: 0.8, borderRight: '1px solid #000', textAlign: 'center' }}>UOM</Box>
            <Box sx={{ width: 60, p: 0.8, textAlign: 'center' }}>Quantity</Box>
          </Box>

          {/* Table Rows */}
          {[
            { sr: 1, name: 'Pallets', qty: counts.Pallet },
            { sr: 2, name: 'Sleeves', qty: counts.Sleeve },
            { sr: 3, name: 'Top Lid', qty: counts.Lid },
            { sr: 4, name: 'Insert', qty: counts.Insert },
            { sr: 5, name: 'Separator', qty: counts['Layer Pad'] },
          ].map((item) => (
            <Box key={item.sr} sx={{ display: 'flex', borderBottom: '1px solid #000', fontSize: 11, height: 26, flexShrink: 0 }}>
              <Box sx={{ width: 40, p: 0.8, borderRight: '1px solid #000', textAlign: 'center' }}>{item.sr})</Box>
              <Box sx={{ flex: 1, p: 0.8, borderRight: '1px solid #000' }}></Box>
              <Box sx={{ flex: 2, p: 0.8, borderRight: '1px solid #000' }}>{item.name}</Box>
              <Box sx={{ width: 50, p: 0.8, borderRight: '1px solid #000', textAlign: 'center' }}>NOS</Box>
              <Box sx={{ width: 60, p: 0.8, textAlign: 'right', fontWeight: 'bold' }}>{item.qty}</Box>
            </Box>
          ))}
          
          {/* Empty filler area that expands automatically */}
          <Box sx={{ flex: 1 }} />
        </Box>

        {/* Footer */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          border: '1px solid #000', 
          minHeight: { xs: 'auto', sm: 70 },
          flexShrink: 0 
        }}>
          <Box sx={{ 
            flex: 1, 
            p: 1, 
            borderRight: { xs: 'none', sm: '1px solid #000' }, 
            borderBottom: { xs: '1px solid #000', sm: 'none' },
            fontSize: 11, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            gap: 1
          }}>
             <Box>GST No. : ______________________</Box>
             <Box>Dispatched Through _________________</Box>
             <Box sx={{ fontWeight: 'bold', mt: 0.5 }}>For Unostar Value Chain Pvt. Ltd.</Box>
             <Box sx={{ mt: 1, fontWeight: 'bold' }}>Dispatch Supervisor<br/>Dispatch in Shift - (1/2/3)</Box>
          </Box>
          <Box sx={{ 
            flex: 1, 
            p: 1, 
            fontSize: 11, 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'center' 
          }}>
             Receiver's Signature with Rubber Stamp
          </Box>
        </Box>
      </Box>
    </>
  );
}